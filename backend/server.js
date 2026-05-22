const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');
const db = require('./db/connection');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = 3000;
const wsClients = new Set();

// WebSocket
wss.on('connection', (ws) => {
    wsClients.add(ws);
    console.log('📡 WS client connected');
    ws.on('close', () => wsClients.delete(ws));
});
db.setWsClients(wsClients);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/drivers', express.static(path.join(__dirname, '..', 'drivers')));
app.use('/trucks', express.static(path.join(__dirname, '..', 'trucks')));
app.use('/trailers', express.static(path.join(__dirname, '..', 'trailers')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ==================== AUTH ====================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const r = await db.execute(
            `SELECT u.user_id, u.username, u.display_name, u.avatar_url, r.role_name, r.access_level
             FROM app_user u JOIN roles r ON u.role_id = r.role_id
             WHERE u.username = :1 AND u.password_hash = :2`,
            [username, password]
        );
        if (r.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        await db.executeRaw(`UPDATE app_user SET last_login = SYSTIMESTAMP WHERE user_id = :1`, [r.rows[0].USER_ID]);
        res.json({ user: r.rows[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password, displayName, roleName } = req.body;
        const roleR = await db.executeRaw(`SELECT role_id FROM roles WHERE role_name = :1`, [roleName]);
        if (roleR.rows.length === 0) return res.status(400).json({ error: 'Invalid role' });
        const roleId = roleR.rows[0].ROLE_ID;
        await db.execute(
            `INSERT INTO app_user (username, password_hash, display_name, role_id) VALUES (:1, :2, :3, :4)`,
            [username, password, displayName, roleId]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/roles', async (req, res) => {
    try {
        const r = await db.execute('SELECT role_id, role_name, access_level FROM roles ORDER BY access_level DESC');
        res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== DASHBOARD ====================
app.get('/api/dashboard/kpis', async (req, res) => {
    try {
        const [loads, trucks, revenue] = await Promise.all([
            db.execute(`SELECT COUNT(*) AS cnt FROM load WHERE status = 'In Transit'`),
            db.execute(`SELECT COUNT(*) AS cnt FROM tractor WHERE status IN ('Available','Spare')`),
            db.execute(`SELECT NVL(SUM(total_amount),0) AS total FROM invoice WHERE status = 'Paid'`)
        ]);
        // Exceptions = unread notifications from last 24h only (not all time)
        const exceptions = await db.execute(
            `SELECT COUNT(*) AS cnt FROM notification WHERE is_read = 0 AND created_at >= SYSTIMESTAMP - INTERVAL '24' HOUR`
        );
        const ontime = await db.execute(`SELECT COUNT(*) AS cnt FROM load WHERE status = 'Delivered' AND actual_delivery <= delivery_date`);
        const total_del = await db.execute(`SELECT COUNT(*) AS cnt FROM load WHERE status = 'Delivered'`);
        const otPct = total_del.rows[0].CNT > 0 ? ((ontime.rows[0].CNT / total_del.rows[0].CNT) * 100).toFixed(1) : 94.2;
        res.json({
            activeLoads: loads.rows[0].CNT,
            onTimePct: parseFloat(otPct),
            trucksAvailable: trucks.rows[0].CNT,
            exceptions: exceptions.rows[0].CNT,
            revenue: revenue.rows[0].TOTAL
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard/dispatch-today', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT l.load_id, l.load_code, l.status, l.priority, l.cargo_desc,
                    h1.city AS pickup_city, h2.city AS dropoff_city,
                    d.first_name || ' ' || d.last_name AS driver_name, d.photo_path
             FROM load l
             LEFT JOIN hub h1 ON l.pickup_hub_id = h1.hub_id
             LEFT JOIN hub h2 ON l.dropoff_hub_id = h2.hub_id
             LEFT JOIN trip t ON l.trip_id = t.trip_id
             LEFT JOIN driver d ON t.driver_id = d.driver_id
             WHERE l.status IN ('In Transit','Assigned','Loading')
             ORDER BY l.created_at DESC FETCH FIRST 20 ROWS ONLY`
        );
        res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard/alerts', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT notif_id, title, message, notif_type, is_read, created_at FROM notification
             WHERE is_read = 0 ORDER BY created_at DESC FETCH FIRST 50 ROWS ONLY`
        );
        res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Clear all notifications (mark as read)
app.post('/api/notifications/clear', async (req, res) => {
    try {
        await db.executeRaw(`UPDATE notification SET is_read = 1 WHERE is_read = 0`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Unread notification count for badge
app.get('/api/notifications/unread-count', async (req, res) => {
    try {
        const r = await db.execute(`SELECT COUNT(*) AS cnt FROM notification WHERE is_read = 0 AND created_at >= SYSTIMESTAMP - INTERVAL '24' HOUR`);
        res.json({ count: r.rows[0].CNT });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard/map-vehicles', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT t.trip_id, t.current_lat, t.current_lng, t.status AS trip_status, t.progress_pct,
                    tr.reg_no, tr.make || ' ' || tr.model AS truck_name, tr.tractor_id,
                    d.first_name || ' ' || d.last_name AS driver_name,
                    l.load_code, l.cargo_desc, l.status AS load_status,
                    h1.city AS from_city, h2.city AS to_city,
                    r.route_id
             FROM trip t
             JOIN tractor tr ON t.tractor_id = tr.tractor_id
             JOIN driver d ON t.driver_id = d.driver_id
             LEFT JOIN load l ON l.trip_id = t.trip_id
             LEFT JOIN route r ON t.route_id = r.route_id
             LEFT JOIN hub h1 ON r.origin_hub_id = h1.hub_id
             LEFT JOIN hub h2 ON r.dest_hub_id = h2.hub_id
             WHERE t.status = 'In Transit'`
        );
        res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Alias for frontend compatibility
app.get('/api/tracking/positions', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT t.trip_id, t.current_lat, t.current_lng, t.status AS trip_status, t.progress_pct,
                    tr.reg_no, tr.make || ' ' || tr.model AS truck_name, tr.tractor_id,
                    d.first_name || ' ' || d.last_name AS driver_name,
                    l.load_code, l.cargo_desc, l.status AS load_status,
                    h1.city AS from_city, h2.city AS to_city,
                    r.route_id
             FROM trip t
             JOIN tractor tr ON t.tractor_id = tr.tractor_id
             JOIN driver d ON t.driver_id = d.driver_id
             LEFT JOIN load l ON l.trip_id = t.trip_id
             LEFT JOIN route r ON t.route_id = r.route_id
             LEFT JOIN hub h1 ON r.origin_hub_id = h1.hub_id
             LEFT JOIN hub h2 ON r.dest_hub_id = h2.hub_id
             WHERE t.status = 'In Transit'`
        );
        res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== LOADS ====================
app.get('/api/loads', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT l.*, c.company_name, h1.city AS pickup_city, h2.city AS dropoff_city,
                    d.first_name || ' ' || d.last_name AS driver_name, d.photo_path AS driver_photo
             FROM load l
             LEFT JOIN customer c ON l.customer_id = c.customer_id
             LEFT JOIN hub h1 ON l.pickup_hub_id = h1.hub_id
             LEFT JOIN hub h2 ON l.dropoff_hub_id = h2.hub_id
             LEFT JOIN trip t ON l.trip_id = t.trip_id
             LEFT JOIN driver d ON t.driver_id = d.driver_id
             ORDER BY l.created_at DESC`
        );
        res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/loads/:id', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT l.*, c.company_name, h1.city AS pickup_city, h1.address AS pickup_addr,
                    h2.city AS dropoff_city, h2.address AS dropoff_addr,
                    t.trip_id, t.tractor_id, t.progress_pct, t.current_lat, t.current_lng,
                    tr.reg_no, tr.make || ' ' || tr.model AS truck_name,
                    trl.trailer_code, trl.trailer_type,
                    d.driver_id, d.first_name || ' ' || d.last_name AS driver_name, d.status AS driver_status, d.photo_path AS driver_photo, d.phone AS driver_phone,
                    rt.distance_km, rt.est_hours, rt.route_name
             FROM load l
             LEFT JOIN customer c ON l.customer_id = c.customer_id
             LEFT JOIN hub h1 ON l.pickup_hub_id = h1.hub_id
             LEFT JOIN hub h2 ON l.dropoff_hub_id = h2.hub_id
             LEFT JOIN trip t ON l.trip_id = t.trip_id
             LEFT JOIN tractor tr ON t.tractor_id = tr.tractor_id
             LEFT JOIN trailer trl ON t.trailer_id = trl.trailer_id
             LEFT JOIN driver d ON t.driver_id = d.driver_id
             LEFT JOIN route rt ON t.route_id = rt.route_id
             WHERE l.load_id = :1`, [req.params.id]
        );
        if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        const load = r.rows[0];

        // Get timeline
        const tl = await db.execute(
            `SELECT * FROM load_timeline WHERE load_id = :1 ORDER BY event_time DESC`, [req.params.id]
        );

        // Get co-driver (resting driver from pair)
        let coDriver = null;
        if (load.TRACTOR_ID && driverPairs[load.TRACTOR_ID]) {
            const pair = driverPairs[load.TRACTOR_ID];
            const coDriverId = pair[0] === load.DRIVER_ID ? pair[1] : pair[0];
            if (coDriverId && coDriverId !== load.DRIVER_ID && pair[0] !== pair[1]) {
                const cd = await db.execute(
                    `SELECT driver_id, first_name || ' ' || last_name AS name, status, photo_path FROM driver WHERE driver_id = :1`, [coDriverId]
                );
                if (cd.rows.length) coDriver = cd.rows[0];
            }
        }

        res.json({ ...load, timeline: tl.rows, coDriver });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/loads/:id/notes', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT n.*, u.display_name FROM load_note n LEFT JOIN app_user u ON n.user_id = u.user_id
             WHERE n.load_id = :1 ORDER BY n.created_at DESC`, [req.params.id]);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/loads/:id/notes', async (req, res) => {
    try {
        await db.execute(`INSERT INTO load_note (load_id, user_id, content) VALUES (:1, :2, :3)`,
            [req.params.id, req.body.userId || 1, req.body.content]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/loads/:id/documents', async (req, res) => {
    try {
        const r = await db.execute(`SELECT * FROM load_document WHERE load_id = :1 ORDER BY uploaded_at DESC`, [req.params.id]);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// Load recommendations for creating a new load
app.get('/api/loads/recommend/:hubId', async (req, res) => {
    try {
        const hubId = req.params.hubId;
        const [trucks, drivers, trailers] = await Promise.all([
            db.execute(`SELECT * FROM tractor WHERE status = 'Spare' AND home_hub_id = :1`, [hubId]),
            db.execute(`SELECT * FROM driver WHERE status = 'Available' AND current_hub_id = :1`, [hubId]),
            db.execute(`SELECT * FROM trailer WHERE status = 'Spare' AND home_hub_id = :1`, [hubId])
        ]);
        res.json({ trucks: trucks.rows, drivers: drivers.rows, trailers: trailers.rows });
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/loads', async (req, res) => {
    try {
        const { customerId, pickupHubId, dropoffHubId, priority, rate, cargoDesc, cargoWeight, tractorId, trailerId, driverId, coDriverId } = req.body;
        // Generate load code
        const codeR = await db.executeRaw(`SELECT 'LD-2026-' || LPAD(NVL(MAX(load_id),0)+1, 3, '0') AS code FROM load`);
        const code = codeR.rows[0].CODE;

        // Find route between pickup and dropoff hubs
        const routeR = await db.executeRaw(
            `SELECT route_id, distance_km FROM route WHERE origin_hub_id = :1 AND dest_hub_id = :2 AND is_active = 1 FETCH FIRST 1 ROWS ONLY`,
            [pickupHubId, dropoffHubId]
        );
        if (routeR.rows.length === 0) return res.status(400).json({ error: 'No active route found between selected hubs' });
        const routeId = routeR.rows[0].ROUTE_ID;
        const distKm = routeR.rows[0].DISTANCE_KM;

        // Get origin hub coordinates
        const hubR = await db.executeRaw(`SELECT latitude, longitude FROM hub WHERE hub_id = :1`, [pickupHubId]);
        const originLat = hubR.rows[0]?.LATITUDE || 20.0;
        const originLng = hubR.rows[0]?.LONGITUDE || 78.0;

        // Create trip
        await db.execute(
            `INSERT INTO trip (route_id, tractor_id, trailer_id, driver_id, status, planned_start, actual_start, progress_pct, current_lat, current_lng)
             VALUES (:1, :2, :3, :4, 'In Transit', SYSTIMESTAMP, SYSTIMESTAMP, 0, :5, :6)`,
            [routeId, tractorId, trailerId || null, driverId, originLat, originLng]
        );
        // Get the new trip ID
        const tripIdR = await db.executeRaw(`SELECT MAX(trip_id) AS id FROM trip`);
        const tripId = tripIdR.rows[0].ID;

        // Create load linked to trip
        await db.execute(
            `INSERT INTO load (load_code, customer_id, pickup_hub_id, dropoff_hub_id, trip_id, status, priority, rate, cargo_desc, cargo_weight_kg)
             VALUES (:1,:2,:3,:4,:5,'Loading',:6,:7,:8,:9)`,
            [code, customerId, pickupHubId, dropoffHubId, tripId, priority || 'Medium', rate, cargoDesc, cargoWeight]
        );

        // Update tractor status
        await db.executeRaw(`UPDATE tractor SET status = 'In Use' WHERE tractor_id = :1`, [tractorId]);
        // Update trailer status
        if (trailerId) {
            await db.executeRaw(`UPDATE trailer SET status = 'In Use' WHERE trailer_id = :1`, [trailerId]);
        }
        // Update driver status
        await db.executeRaw(`UPDATE driver SET status = 'On Trip' WHERE driver_id = :1`, [driverId]);
        // Update co-driver status
        if (coDriverId) {
            await db.executeRaw(`UPDATE driver SET status = 'On Rest' WHERE driver_id = :1`, [coDriverId]);
        }

        // Register into simulation engine
        simTrips[tripId] = {
            phase: 'loading', timer: 15, simMin: 0,
            distKm: distKm, tractorId: Number(tractorId), driverId: Number(driverId),
            routeId: routeId, originHub: Number(pickupHubId), destHub: Number(dropoffHubId),
            nextFood: 240, nextSleep: 540
        };
        // Set driver pairs
        driverPairs[Number(tractorId)] = coDriverId ? [Number(driverId), Number(coDriverId)] : [Number(driverId), Number(driverId)];

        // Get tractor reg_no and driver name for notifications
        const trR = await db.executeRaw(`SELECT reg_no FROM tractor WHERE tractor_id = :1`, [tractorId]);
        const regNo = trR.rows[0]?.REG_NO || 'Unknown';
        const dnR = await db.executeRaw(`SELECT first_name || ' ' || last_name AS n FROM driver WHERE driver_id = :1`, [driverId]);
        const driverName = dnR.rows[0]?.N || 'Driver';

        // Add notification
        await addNotification('🆕 New Load Created', `${code} assigned to ${regNo}`, 'info');
        // Add timeline entry
        await addTimeline(tripId, '📦 Load Created', `Load ${code} assigned to ${regNo} with driver ${driverName}`);

        res.json({ success: true, loadCode: code, tripId: tripId });
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== DISPATCH ====================
app.get('/api/dispatch', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT l.*, c.company_name, h1.city AS pickup_city, h2.city AS dropoff_city,
                    d.first_name || ' ' || d.last_name AS driver_name, d.photo_path AS driver_photo
             FROM load l
             LEFT JOIN customer c ON l.customer_id = c.customer_id
             LEFT JOIN hub h1 ON l.pickup_hub_id = h1.hub_id
             LEFT JOIN hub h2 ON l.dropoff_hub_id = h2.hub_id
             LEFT JOIN trip t ON l.trip_id = t.trip_id
             LEFT JOIN driver d ON t.driver_id = d.driver_id
             ORDER BY l.created_at DESC`
        );
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== FLEET ====================
app.get('/api/fleet/tractors', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT t.*, h.city AS hub_city,
                    d.first_name || ' ' || d.last_name AS driver_name, d.photo_path AS driver_photo, d.status AS driver_status
             FROM tractor t
             LEFT JOIN hub h ON t.home_hub_id = h.hub_id
             LEFT JOIN trip tp ON tp.tractor_id = t.tractor_id AND tp.status = 'In Transit'
             LEFT JOIN driver d ON tp.driver_id = d.driver_id
             ORDER BY t.tractor_id`
        );
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/fleet/trailers', async (req, res) => {
    try {
        const r = await db.execute(`SELECT t.*, h.city AS hub_city FROM trailer t LEFT JOIN hub h ON t.home_hub_id = h.hub_id ORDER BY t.trailer_id`);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/fleet/tractors/:id', async (req, res) => {
    try {
        const r = await db.execute(`SELECT t.*, h.city AS hub_city FROM tractor t LEFT JOIN hub h ON t.home_hub_id = h.hub_id WHERE t.tractor_id = :1`, [req.params.id]);
        if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        const m = await db.execute(`SELECT * FROM maintenance WHERE tractor_id = :1 ORDER BY maint_date DESC`, [req.params.id]);
        res.json({ ...r.rows[0], maintenance: m.rows });
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== DRIVERS ====================
app.get('/api/drivers', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT d.*, h.city AS hub_city,
                    t.trip_id, r.route_name,
                    h1.city AS from_city, h2.city AS to_city
             FROM driver d
             LEFT JOIN hub h ON d.current_hub_id = h.hub_id
             LEFT JOIN trip t ON t.driver_id = d.driver_id AND t.status = 'In Transit'
             LEFT JOIN route r ON t.route_id = r.route_id
             LEFT JOIN hub h1 ON r.origin_hub_id = h1.hub_id
             LEFT JOIN hub h2 ON r.dest_hub_id = h2.hub_id
             ORDER BY d.driver_id`
        );
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// GET available drivers (before :id to avoid matching 'available' as id)
app.get('/api/drivers/available', async (req, res) => {
    try {
        const r = await db.execute(`SELECT d.*, h.city AS hub_city FROM driver d LEFT JOIN hub h ON d.current_hub_id = h.hub_id WHERE d.status = 'Available' ORDER BY d.driver_id`);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/drivers/:id', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT d.*, h.city AS hub_city,
                    t.trip_id, t.progress_pct, t.status AS trip_status,
                    tr.reg_no AS truck_reg, tr.make || ' ' || tr.model AS truck_name,
                    rt.route_name, rt.distance_km,
                    h1.city AS from_city, h2.city AS to_city
             FROM driver d
             LEFT JOIN hub h ON d.current_hub_id = h.hub_id
             LEFT JOIN trip t ON t.driver_id = d.driver_id AND t.status = 'In Transit'
             LEFT JOIN tractor tr ON t.tractor_id = tr.tractor_id
             LEFT JOIN route rt ON t.route_id = rt.route_id
             LEFT JOIN hub h1 ON rt.origin_hub_id = h1.hub_id
             LEFT JOIN hub h2 ON rt.dest_hub_id = h2.hub_id
             WHERE d.driver_id = :1`, [req.params.id]
        );
        if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(r.rows[0]);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== ROUTES & TRACKING ====================
app.get('/api/routes', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT r.*, h1.city AS origin_city, h1.latitude AS origin_lat, h1.longitude AS origin_lng,
                    h2.city AS dest_city, h2.latitude AS dest_lat, h2.longitude AS dest_lng
             FROM route r JOIN hub h1 ON r.origin_hub_id = h1.hub_id JOIN hub h2 ON r.dest_hub_id = h2.hub_id
             WHERE r.is_active = 1 ORDER BY r.route_id`
        );
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/routes/:id/waypoints', async (req, res) => {
    try {
        const r = await db.execute(`SELECT * FROM route_waypoint WHERE route_id = :1 ORDER BY seq_no`, [req.params.id]);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/tracking/positions', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT t.trip_id, t.current_lat, t.current_lng, t.progress_pct, t.route_id,
                    tr.reg_no, tr.make || ' ' || tr.model AS truck_name,
                    d.first_name || ' ' || d.last_name AS driver_name,
                    l.load_code, l.cargo_desc,
                    h1.city AS from_city, h2.city AS to_city
             FROM trip t
             JOIN tractor tr ON t.tractor_id = tr.tractor_id
             JOIN driver d ON t.driver_id = d.driver_id
             LEFT JOIN load l ON l.trip_id = t.trip_id
             JOIN route r ON t.route_id = r.route_id
             JOIN hub h1 ON r.origin_hub_id = h1.hub_id
             JOIN hub h2 ON r.dest_hub_id = h2.hub_id
             WHERE t.status = 'In Transit'`
        );
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== WAREHOUSES ====================
app.get('/api/warehouses', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT w.*, h.city, h.state FROM warehouse w LEFT JOIN hub h ON w.hub_id = h.hub_id ORDER BY w.warehouse_id`
        );
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== BILLING ====================
app.get('/api/invoices', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT i.*, c.company_name, c.email AS customer_email
             FROM invoice i LEFT JOIN customer c ON i.customer_id = c.customer_id
             ORDER BY i.created_at DESC`
        );
        const totals = await db.execute(
            `SELECT NVL(SUM(CASE WHEN status='Pending' THEN net_amount ELSE 0 END),0) AS pending,
                    NVL(SUM(CASE WHEN status='Paid' THEN net_amount ELSE 0 END),0) AS paid,
                    NVL(SUM(CASE WHEN status='Overdue' THEN net_amount ELSE 0 END),0) AS overdue,
                    NVL(SUM(net_amount),0) AS total FROM invoice`
        );
        res.json({ invoices: r.rows, totals: totals.rows[0] });
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== REPORTS ====================
app.get('/api/reports/performance', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT r.route_name, COUNT(t.trip_id) AS trip_count,
                    ROUND(AVG(t.distance_km),1) AS avg_distance,
                    ROUND(AVG(t.fuel_consumed_l),1) AS avg_fuel
             FROM trip t JOIN route r ON t.route_id = r.route_id
             GROUP BY r.route_name ORDER BY trip_count DESC`
        );
        const drivers = await db.execute(
            `SELECT d.first_name || ' ' || d.last_name AS name, d.driver_rating, d.total_trips, d.total_km
             FROM driver d WHERE d.total_trips > 0 ORDER BY d.driver_rating DESC FETCH FIRST 10 ROWS ONLY`
        );
        res.json({ routePerformance: r.rows, topDrivers: drivers.rows });
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/reports/financial', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT c.company_name, COUNT(i.invoice_id) AS inv_count,
                    SUM(i.net_amount) AS total_billed, SUM(CASE WHEN i.status='Paid' THEN i.net_amount ELSE 0 END) AS total_paid
             FROM invoice i JOIN customer c ON i.customer_id = c.customer_id
             GROUP BY c.company_name ORDER BY total_billed DESC`
        );
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== QUERIES TERMINAL ====================
app.post('/api/queries/execute', async (req, res) => {
    try {
        const { sql } = req.body;
        const sqlUpper = sql.trim().toUpperCase();
        // Block dangerous DDL operations only
        const blocked = ['DROP ', 'TRUNCATE ', 'ALTER ', 'CREATE ', 'GRANT ', 'REVOKE '];
        if (blocked.some(b => sqlUpper.startsWith(b))) {
            return res.status(403).json({ error: 'DDL operations (DROP, ALTER, CREATE, TRUNCATE) are not allowed in the terminal' });
        }
        const r = await db.execute(sql);
        // For SELECT queries, return rows
        if (sqlUpper.startsWith('SELECT')) {
            res.json({ rows: r.rows, rowCount: r.rows ? r.rows.length : 0 });
        } else {
            // For INSERT/UPDATE/DELETE, return affected count
            res.json({ rows: [], rowCount: 0, affectedRows: r.rowsAffected || 0, message: `✅ ${r.rowsAffected || 0} row(s) affected` });
        }
    } catch(e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/queries/log', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT log_id, DBMS_LOB.SUBSTR(sql_text, 200, 1) AS sql_text, sql_type, table_name,
                    execution_ms, row_count, executed_by, executed_at
             FROM query_log ORDER BY executed_at DESC FETCH FIRST 50 ROWS ONLY`
        );
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== SETTINGS ====================
app.get('/api/settings/users', async (req, res) => {
    try {
        const r = await db.execute(
            `SELECT u.user_id, u.username, u.display_name, u.last_login, r.role_name, r.access_level
             FROM app_user u JOIN roles r ON u.role_id = r.role_id ORDER BY u.user_id`
        );
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/hubs', async (req, res) => {
    try {
        const r = await db.execute('SELECT * FROM hub ORDER BY hub_id');
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/customers', async (req, res) => {
    try {
        const r = await db.execute('SELECT * FROM customer ORDER BY customer_id');
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== FLEET ====================
app.get('/api/fleet/tractors', async (req, res) => {
    try {
        const r = await db.execute(`
            SELECT t.tractor_id, t.reg_no, t.make, t.model, t.year, t.fuel_type, t.status,
                   t.mileage_km, t.engine_hp, h.city AS hub_city,
                   d.first_name || ' ' || d.last_name AS driver_name
            FROM tractor t LEFT JOIN hub h ON t.current_hub_id = h.hub_id
            LEFT JOIN trip tr ON t.tractor_id = tr.tractor_id AND tr.status = 'In Transit'
            LEFT JOIN driver d ON tr.driver_id = d.driver_id
            ORDER BY t.tractor_id`);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/fleet/tractors/:id', async (req, res) => {
    try {
        const r = await db.execute(`
            SELECT t.*, h.city AS hub_city FROM tractor t
            LEFT JOIN hub h ON t.current_hub_id = h.hub_id WHERE t.tractor_id = :1`, [req.params.id]);
        const maint = await db.execute(`
            SELECT maint_type, description, cost, maint_date FROM maintenance
            WHERE tractor_id = :1 ORDER BY maint_date DESC`, [req.params.id]);
        const data = r.rows[0] || {};
        data.maintenance = maint.rows;
        res.json(data);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/fleet/trailers', async (req, res) => {
    try {
        const r = await db.execute(`
            SELECT tr.trailer_id, tr.trailer_code, tr.trailer_type, tr.status,
                   tr.capacity_tons, h.city AS hub_city
            FROM trailer tr LEFT JOIN hub h ON tr.current_hub_id = h.hub_id ORDER BY tr.trailer_id`);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== DRIVERS ====================
app.get('/api/drivers', async (req, res) => {
    try {
        const r = await db.execute(`
            SELECT d.driver_id, d.first_name, d.last_name, d.license_no, d.phone, d.status,
                   d.driver_rating, d.total_trips, d.total_km, h.city AS hub_city,
                   r.route_name, h1.city AS from_city, h2.city AS to_city
            FROM driver d LEFT JOIN hub h ON d.current_hub_id = h.hub_id
            LEFT JOIN trip t ON d.driver_id = t.driver_id AND t.status = 'In Transit'
            LEFT JOIN route r ON t.route_id = r.route_id
            LEFT JOIN hub h1 ON r.origin_hub_id = h1.hub_id
            LEFT JOIN hub h2 ON r.dest_hub_id = h2.hub_id
            ORDER BY d.driver_id`);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// GET available drivers (must be before :id route)
app.get('/api/drivers/available', async (req, res) => {
    try {
        const r = await db.execute(`SELECT d.*, h.city AS hub_city FROM driver d LEFT JOIN hub h ON d.current_hub_id = h.hub_id WHERE d.status = 'Available' ORDER BY d.driver_id`);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/drivers/:id', async (req, res) => {
    try {
        const r = await db.execute(`
            SELECT d.*, h.city AS hub_city FROM driver d
            LEFT JOIN hub h ON d.current_hub_id = h.hub_id WHERE d.driver_id = :1`, [req.params.id]);
        res.json(r.rows[0] || {});
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== TRUCK & TRAILER TYPE DATA ====================
const TRUCK_TYPES = [
    { make: 'Volvo', model: 'FH16', hp: 750, torque_nm: 3550, gvw_kg: 44000, fuel_tank_l: 500, axles: 3, image: '/trucks/volvo.jpg' },
    { make: 'Scania', model: 'R770', hp: 770, torque_nm: 3700, gvw_kg: 44000, fuel_tank_l: 490, axles: 3, image: '/trucks/scania.jpg' },
    { make: 'Mercedes-Benz', model: 'Actros 4165 SLT', hp: 625, torque_nm: 3000, gvw_kg: 41000, fuel_tank_l: 480, axles: 3, image: '/trucks/merc_actross.jpg' },
    { make: 'DAF', model: 'XG+ 660', hp: 660, torque_nm: 2950, gvw_kg: 40000, fuel_tank_l: 470, axles: 3, image: '/trucks/daf.jpg' }
];

const TRAILER_TYPES = [
    { type: 'Flatbed', image: '/trailers/flatbed.jpg', makes: [
        { make: 'Ashok Leyland', capacity_kg: 25000, capacity_m3: 85, length_m: 13.6 },
        { make: 'TATA', capacity_kg: 24000, capacity_m3: 82, length_m: 13.6 }
    ]},
    { type: 'DRY Van', image: '/trailers/dry.jpg', makes: [
        { make: 'Mahindra', capacity_kg: 22000, capacity_m3: 76, length_m: 13.6 },
        { make: 'SML Isuzu', capacity_kg: 21000, capacity_m3: 74, length_m: 12.5 }
    ]},
    { type: 'Refrigerated', image: '/trailers/refrigerated.jpg', makes: [
        { make: 'Carrier Transicold', capacity_kg: 18000, capacity_m3: 62, length_m: 12.5 },
        { make: 'Thermo King', capacity_kg: 17500, capacity_m3: 60, length_m: 12.5 }
    ]},
    { type: 'Tank', image: '/trailers/tank.jpg', makes: [
        { make: 'Feldbinder', capacity_kg: 30000, capacity_m3: 25, length_m: 12 }
    ]},
    { type: 'Low Boy', image: '/trailers/lowboy.jpg', makes: [
        { make: 'Goldhofer', capacity_kg: 50000, capacity_m3: null, length_m: 16 }
    ]},
    { type: 'Car Hauler', image: '/trailers/car_hauler.jpg', makes: [
        { make: 'Lohr', capacity_kg: 20000, capacity_m3: null, length_m: 20.5 }
    ]},
    { type: 'Double', image: '/trailers/double.jpeg', makes: [
        { make: 'Krone', capacity_kg: 40000, capacity_m3: 150, length_m: 25.25 }
    ]}
];

// ==================== FLEET CRUD ENDPOINTS ====================

// GET truck types
app.get('/api/fleet/truck-types', (req, res) => {
    res.json(TRUCK_TYPES);
});

// GET trailer types
app.get('/api/fleet/trailer-types', (req, res) => {
    res.json(TRAILER_TYPES);
});

// POST create tractor
app.post('/api/fleet/tractors', async (req, res) => {
    try {
        const { make, model, regNo, yearOfMfg, homeHubId } = req.body;
        // Look up truck type specs
        const truckType = TRUCK_TYPES.find(t => t.make === make && t.model === model);
        if (!truckType) return res.status(400).json({ error: 'Invalid truck make/model combination' });

        const insuranceExpiry = new Date();
        insuranceExpiry.setFullYear(insuranceExpiry.getFullYear() + 2);
        const pollutionCertExp = new Date();
        pollutionCertExp.setFullYear(pollutionCertExp.getFullYear() + 1);

        // Get next ID (identity sequence may be out of sync with seed data)
        const nextIdR = await db.executeRaw(`SELECT NVL(MAX(tractor_id),0)+1 AS nid FROM tractor`);
        const nextId = nextIdR.rows[0].NID;

        await db.execute(
            `INSERT INTO tractor (tractor_id, reg_no, make, model, year_of_mfg, horsepower_hp, peak_torque_nm, gvw_kg, fuel_tank_l, num_axles, image_path, home_hub_id, status, odometer_km, health_score, insurance_expiry, pollution_cert_exp, created_at)
             VALUES (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10,:11,:12,'Spare',0,100,:13,:14,SYSTIMESTAMP)`,
            [nextId, regNo, make, model, yearOfMfg, truckType.hp, truckType.torque_nm, truckType.gvw_kg, truckType.fuel_tank_l, truckType.axles, truckType.image, homeHubId, insuranceExpiry, pollutionCertExp]
        );
        const idR = await db.executeRaw(`SELECT MAX(tractor_id) AS id FROM tractor`);
        res.json({ success: true, tractorId: idR.rows[0].ID });
    } catch(e) { res.status(500).json({error:e.message}); }
});

// DELETE tractor
app.delete('/api/fleet/tractors/:id', async (req, res) => {
    try {
        const chk = await db.executeRaw(`SELECT status FROM tractor WHERE tractor_id = :1`, [req.params.id]);
        if (chk.rows.length === 0) return res.status(404).json({ error: 'Tractor not found' });
        if (!['Available', 'Spare'].includes(chk.rows[0].STATUS)) {
            return res.status(400).json({ error: `Cannot delete tractor with status '${chk.rows[0].STATUS}'. Must be Available or Spare.` });
        }
        await db.execute(`DELETE FROM tractor WHERE tractor_id = :1`, [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({error:e.message}); }
});

// POST create trailer
app.post('/api/fleet/trailers', async (req, res) => {
    try {
        const { trailerType, make, homeHubId } = req.body;
        // Look up trailer type specs
        const tType = TRAILER_TYPES.find(t => t.type === trailerType);
        if (!tType) return res.status(400).json({ error: 'Invalid trailer type' });
        const makeSpec = tType.makes.find(m => m.make === make);
        if (!makeSpec) return res.status(400).json({ error: 'Invalid make for this trailer type' });

        // Generate trailer code: TRL-XX-NNN
        const abbrevMap = { 'Flatbed': 'FB', 'DRY Van': 'DV', 'Refrigerated': 'RF', 'Tank': 'TK', 'Low Boy': 'LB', 'Car Hauler': 'CH', 'Double': 'DB' };
        const abbr = abbrevMap[trailerType] || 'XX';
        const cntR = await db.executeRaw(`SELECT COUNT(*) AS cnt FROM trailer WHERE trailer_type = :1`, [trailerType]);
        const nextNum = (cntR.rows[0].CNT || 0) + 1;
        const trailerCode = `TRL-${abbr}-${String(nextNum).padStart(3, '0')}`;

        // Get next ID
        const nextIdR = await db.executeRaw(`SELECT NVL(MAX(trailer_id),0)+1 AS nid FROM trailer`);
        const nextId = nextIdR.rows[0].NID;

        await db.execute(
            `INSERT INTO trailer (trailer_id, trailer_code, trailer_type, make, manufacture_year, capacity_kg, capacity_m3, length_m, image_path, home_hub_id, status, created_at)
             VALUES (:1,:2,:3,:4,2024,:5,:6,:7,:8,:9,'Spare',SYSTIMESTAMP)`,
            [nextId, trailerCode, trailerType, make, makeSpec.capacity_kg, makeSpec.capacity_m3, makeSpec.length_m, tType.image, homeHubId]
        );
        const idR = await db.executeRaw(`SELECT MAX(trailer_id) AS id FROM trailer`);
        res.json({ success: true, trailerId: idR.rows[0].ID });
    } catch(e) { res.status(500).json({error:e.message}); }
});

// DELETE trailer
app.delete('/api/fleet/trailers/:id', async (req, res) => {
    try {
        const chk = await db.executeRaw(`SELECT status FROM trailer WHERE trailer_id = :1`, [req.params.id]);
        if (chk.rows.length === 0) return res.status(404).json({ error: 'Trailer not found' });
        if (!['Available', 'Spare'].includes(chk.rows[0].STATUS)) {
            return res.status(400).json({ error: `Cannot delete trailer with status '${chk.rows[0].STATUS}'. Must be Available or Spare.` });
        }
        await db.execute(`DELETE FROM trailer WHERE trailer_id = :1`, [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({error:e.message}); }
});

// POST create driver
app.post('/api/drivers', async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, licenseNo, licenseExpiry, phone, email, emergencyContact, bloodGroup, experienceYrs, homeHubId, photoPath } = req.body;
        // Get next ID
        const nextIdR = await db.executeRaw(`SELECT NVL(MAX(driver_id),0)+1 AS nid FROM driver`);
        const nextId = nextIdR.rows[0].NID;

        await db.execute(
            `INSERT INTO driver (driver_id, first_name, last_name, date_of_birth, license_no, license_type, license_expiry, phone, email, emergency_contact, blood_group, experience_yrs, current_hub_id, photo_path, status, driver_rating, total_trips, total_km, created_at)
             VALUES (:1,:2,:3,TO_DATE(:4,'YYYY-MM-DD'),:5,'HMV',TO_DATE(:6,'YYYY-MM-DD'),:7,:8,:9,:10,:11,:12,:13,'Available',4.0,0,0,SYSTIMESTAMP)`,
            [nextId, firstName, lastName, dateOfBirth, licenseNo, licenseExpiry, phone, email, emergencyContact, bloodGroup, experienceYrs, homeHubId, photoPath || '/drivers/default.jpg']
        );
        const idR = await db.executeRaw(`SELECT MAX(driver_id) AS id FROM driver`);
        res.json({ success: true, driverId: idR.rows[0].ID });
    } catch(e) { res.status(500).json({error:e.message}); }
});

// DELETE driver
app.delete('/api/drivers/:id', async (req, res) => {
    try {
        const chk = await db.executeRaw(`SELECT status FROM driver WHERE driver_id = :1`, [req.params.id]);
        if (chk.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
        if (!['Available', 'Off Duty'].includes(chk.rows[0].STATUS)) {
            return res.status(400).json({ error: `Cannot delete driver with status '${chk.rows[0].STATUS}'. Must be Available or Off Duty.` });
        }
        await db.execute(`DELETE FROM driver WHERE driver_id = :1`, [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({error:e.message}); }
});

// GET available tractors
app.get('/api/fleet/available-tractors', async (req, res) => {
    try {
        const r = await db.execute(`SELECT t.*, h.city AS hub_city FROM tractor t LEFT JOIN hub h ON t.home_hub_id = h.hub_id WHERE t.status IN ('Available','Spare') ORDER BY t.tractor_id`);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// GET available trailers
app.get('/api/fleet/available-trailers', async (req, res) => {
    try {
        const r = await db.execute(`SELECT t.*, h.city AS hub_city FROM trailer t LEFT JOIN hub h ON t.home_hub_id = h.hub_id WHERE t.status IN ('Available','Spare') ORDER BY t.trailer_id`);
        res.json(r.rows);
    } catch(e) { res.status(500).json({error:e.message}); }
});

// (available drivers route moved above :id route)

// DELETE load (with full cleanup)
app.delete('/api/loads/:id', async (req, res) => {
    try {
        const loadId = req.params.id;
        // Find load and its trip
        const loadR = await db.executeRaw(`SELECT load_id, load_code, trip_id, status FROM load WHERE load_id = :1`, [loadId]);
        if (loadR.rows.length === 0) return res.status(404).json({ error: 'Load not found' });
        const load = loadR.rows[0];
        const tripId = load.TRIP_ID;

        if (tripId) {
            // Get trip details for cleanup
            const tripR = await db.executeRaw(`SELECT tractor_id, trailer_id, driver_id FROM trip WHERE trip_id = :1`, [tripId]);
            if (tripR.rows.length > 0) {
                const trip = tripR.rows[0];
                // Set tractor to Spare
                if (trip.TRACTOR_ID) {
                    await db.executeRaw(`UPDATE tractor SET status = 'Spare' WHERE tractor_id = :1`, [trip.TRACTOR_ID]);
                }
                // Set trailer to Spare
                if (trip.TRAILER_ID) {
                    await db.executeRaw(`UPDATE trailer SET status = 'Spare' WHERE trailer_id = :1`, [trip.TRAILER_ID]);
                }
                // Set driver to Available
                if (trip.DRIVER_ID) {
                    await db.executeRaw(`UPDATE driver SET status = 'Available' WHERE driver_id = :1`, [trip.DRIVER_ID]);
                }
                // Check for co-driver in driverPairs
                if (trip.TRACTOR_ID && driverPairs[trip.TRACTOR_ID]) {
                    const pair = driverPairs[trip.TRACTOR_ID];
                    for (const did of pair) {
                        if (did && did !== trip.DRIVER_ID) {
                            await db.executeRaw(`UPDATE driver SET status = 'Available' WHERE driver_id = :1 AND status != 'Available'`, [did]);
                        }
                    }
                    delete driverPairs[trip.TRACTOR_ID];
                }
            }
            // Remove from simulation
            delete simTrips[tripId];
        }

        // Delete timeline entries
        await db.executeRaw(`DELETE FROM load_timeline WHERE load_id = :1`, [loadId]);
        // Delete load notes
        await db.executeRaw(`DELETE FROM load_note WHERE load_id = :1`, [loadId]);
        // Delete load documents
        await db.executeRaw(`DELETE FROM load_document WHERE load_id = :1`, [loadId]);
        // Delete the load
        await db.executeRaw(`DELETE FROM load WHERE load_id = :1`, [loadId]);
        // Delete the trip
        if (tripId) {
            await db.executeRaw(`DELETE FROM trip WHERE trip_id = :1`, [tripId]);
        }

        // Add notification about cancellation
        await addNotification('❌ Load Cancelled', `Load ${load.LOAD_CODE || loadId} has been cancelled and removed.`, 'warning');

        res.json({ success: true });
    } catch(e) { res.status(500).json({error:e.message}); }
});

// ==================== REALISTIC SIMULATION ENGINE (1:20) ====================
const SIM_RATIO = 20;
const TICK_MS = 3000; // 3 real seconds per tick
// 3 real sec * 20 sim/real = 60 sim sec = 1 sim minute per tick
const AVG_SPEED = 55; // km/h
const KM_PER_TICK = AVG_SPEED / 60; // ~0.917 km per sim minute

const simTrips = {};     // tripId → phase state
const driverPairs = {};  // tractorId → [driverId1, driverId2]
const waypointCache = {}; // routeId → [{lat,lng}]

function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

async function getWaypoints(routeId) {
    if (waypointCache[routeId]) return waypointCache[routeId];
    const r = await db.executeRaw(
        `SELECT latitude, longitude FROM route_waypoint WHERE route_id = :1 ORDER BY seq_no`, [routeId]
    );
    waypointCache[routeId] = r.rows;
    return r.rows;
}

function interpolatePosition(wps, pct) {
    if (!wps || wps.length < 2) return null;
    const segs = wps.length - 1;
    const exact = (pct / 100) * segs;
    const i = Math.min(Math.floor(exact), segs - 1);
    const f = exact - i;
    return {
        lat: wps[i].LATITUDE + (wps[i + 1].LATITUDE - wps[i].LATITUDE) * f,
        lng: wps[i].LONGITUDE + (wps[i + 1].LONGITUDE - wps[i].LONGITUDE) * f
    };
}

async function addNotification(title, message, type = 'info') {
    try {
        await db.executeRaw(
            `INSERT INTO notification (user_id, title, message, notif_type) VALUES (1, :1, :2, :3)`,
            [title, message, type]
        );
    } catch (e) {}
}

async function addTimeline(tripId, eventType, eventDesc) {
    try {
        // Find load_id for this trip
        const ld = await db.executeRaw(`SELECT load_id FROM load WHERE trip_id = :1 FETCH FIRST 1 ROWS ONLY`, [tripId]);
        if (ld.rows.length) {
            await db.executeRaw(
                `INSERT INTO load_timeline (load_id, event_type, event_desc) VALUES (:1, :2, :3)`,
                [ld.rows[0].LOAD_ID, eventType, eventDesc]
            );
        }
    } catch (e) {}
}

async function initSimulation() {
    // Normalize: we only use 'Spare' for idle trucks/trailers (not 'Available')
    await db.executeRaw(`UPDATE tractor SET status = 'Spare' WHERE status = 'Available'`);
    await db.executeRaw(`UPDATE trailer SET status = 'Spare' WHERE status = 'Available'`);

    const trips = await db.executeRaw(`
        SELECT t.trip_id, t.tractor_id, t.driver_id, t.route_id, t.progress_pct,
               r.distance_km, r.origin_hub_id, r.dest_hub_id
        FROM trip t JOIN route r ON t.route_id = r.route_id WHERE t.status = 'In Transit'
    `);
    const allDrivers = await db.executeRaw(
        `SELECT driver_id, current_hub_id FROM driver WHERE status != 'Terminated' ORDER BY driver_id`
    );
    const usedIds = new Set(trips.rows.map(t => t.DRIVER_ID));

    const tripRows = trips.rows;
    // Stagger: first few trips start in different lifecycle phases for dispatch board variety
    const phaseRotation = ['transit', 'transit', 'transit', 'transit', 'transit',
        'transit', 'transit', 'transit', 'transit', 'transit',
        'transit', 'transit', 'transit',
        'unloading', 'delivered', 'unassigned', 'assigned', 'loading', 'unloading'];

    for (let idx = 0; idx < tripRows.length; idx++) {
        const t = tripRows[idx];
        const dist = t.DISTANCE_KM || 800;
        const elapsed = (t.PROGRESS_PCT / 100) * (dist / AVG_SPEED) * 60;
        const initPhase = phaseRotation[idx % phaseRotation.length];
        const isLifecycle = ['delivered','unassigned','assigned','loading','unloading'].includes(initPhase);

        simTrips[t.TRIP_ID] = {
            phase: initPhase, timer: isLifecycle ? randInt(10, 20) : 0,
            simMin: elapsed,
            distKm: dist, tractorId: t.TRACTOR_ID, driverId: t.DRIVER_ID,
            routeId: t.ROUTE_ID, originHub: t.ORIGIN_HUB_ID, destHub: t.DEST_HUB_ID,
            nextFood: randInt(180, 300) - elapsed,
            nextSleep: randInt(480, 660) - elapsed
        };

        // Set load status in DB for non-transit starts
        if (isLifecycle) {
            const statusMap = { delivered:'Delivered', unassigned:'Unassigned', assigned:'Assigned', loading:'Loading', unloading:'Unloading' };
            await db.executeRaw(`UPDATE load SET status=:1 WHERE trip_id=:2`, [statusMap[initPhase], t.TRIP_ID]);
        }

        // Find co-driver
        const co = allDrivers.rows.find(d => !usedIds.has(d.DRIVER_ID) &&
            (d.CURRENT_HUB_ID === t.ORIGIN_HUB_ID || d.CURRENT_HUB_ID === t.DEST_HUB_ID));
        if (co) { usedIds.add(co.DRIVER_ID); driverPairs[t.TRACTOR_ID] = [t.DRIVER_ID, co.DRIVER_ID]; }
        else { driverPairs[t.TRACTOR_ID] = [t.DRIVER_ID, t.DRIVER_ID]; }
    }
    // Pre-cache all route waypoints
    const routes = await db.executeRaw(`SELECT DISTINCT route_id FROM route_waypoint`);
    for (const r of routes.rows) await getWaypoints(r.ROUTE_ID);

    // Collect all driver IDs used in driverPairs (both primary and co-drivers)
    const pairedDriverIds = new Set();
    for (const pair of Object.values(driverPairs)) {
        pair.forEach(id => pairedDriverIds.add(id));
    }

    // Co-drivers (in a pair but not the trip's primary driver) should be On Rest
    for (const [tractorId, pair] of Object.entries(driverPairs)) {
        if (pair[0] !== pair[1]) {
            // Both drivers are paired — primary is On Trip, co is On Rest
            await db.executeRaw(`UPDATE driver SET status = 'On Rest' WHERE driver_id = :1 AND status = 'Available'`, [pair[1]]);
        }
    }

    // Any driver NOT in a pair and NOT the primary trip driver → Available (truly spare)
    const allIds = allDrivers.rows.map(d => d.DRIVER_ID);
    const spareIds = allIds.filter(id => !pairedDriverIds.has(id));
    if (spareIds.length > 0) {
        await db.executeRaw(`UPDATE driver SET status = 'Available' WHERE driver_id IN (${spareIds.join(',')})`);
    }

    // Keep only Hari Prasad as Off Duty
    await db.executeRaw(`UPDATE driver SET status = 'Off Duty' WHERE LOWER(first_name) = 'hari' AND LOWER(last_name) = 'prasad'`);

    console.log(`🎮 Simulation: ${Object.keys(simTrips).length} trips, 1:${SIM_RATIO} ratio, ${TICK_MS/1000}s ticks`);
}

async function simulationTick() {
    for (const [tripId, s] of Object.entries(simTrips)) {
        try {
            switch (s.phase) {
                case 'transit': {
                    const pctPerTick = (KM_PER_TICK / s.distKm) * 100;
                    const oldPct = await db.executeRaw(`SELECT progress_pct FROM trip WHERE trip_id = :1`, [tripId]);
                    let pct = (oldPct.rows[0]?.PROGRESS_PCT || 0) + pctPerTick;
                    s.simMin += 1;

                    // Food stop check
                    if (s.nextFood <= 0) {
                        s.phase = 'food_stop'; s.timer = 30;
                        s.nextFood = randInt(180, 300);
                        const dn = await db.executeRaw(`SELECT first_name||' '||last_name AS n FROM driver WHERE driver_id=:1`, [s.driverId]);
                        const driverName = dn.rows[0]?.N || 'Driver';
                        await addNotification('🍽️ Meal Break', `${driverName} stopped for meal on route`, 'info');
                        await addTimeline(tripId, '🍽️ Meal Break', `${driverName} stopped for food break`);
                        break;
                    }
                    if (s.nextSleep <= 0) {
                        s.phase = 'sleep_stop'; s.timer = 90;
                        s.nextSleep = randInt(480, 660);
                        const dn = await db.executeRaw(`SELECT first_name||' '||last_name AS n FROM driver WHERE driver_id=:1`, [s.driverId]);
                        const driverName = dn.rows[0]?.N || 'Driver';
                        await addNotification('😴 Rest Break', `${driverName} stopped for mandatory rest`, 'warning');
                        await addTimeline(tripId, '😴 Rest Break', `${driverName} stopped for mandatory rest (8h)`);
                        break;
                    }
                    s.nextFood -= 1; s.nextSleep -= 1;

                    if (pct >= 100) {
                        pct = 100;
                        s.phase = 'arrived'; s.timer = 15;
                        const dn = await db.executeRaw(`SELECT first_name||' '||last_name AS n FROM driver WHERE driver_id=:1`, [s.driverId]);
                        const tr = await db.executeRaw(`SELECT reg_no FROM tractor WHERE tractor_id=:1`, [s.tractorId]);
                        await addNotification('📍 Arrived', `${tr.rows[0]?.REG_NO} arrived at destination. ${dn.rows[0]?.N} unloading.`, 'delivery');
                        await addTimeline(tripId, '📍 Arrived', `${tr.rows[0]?.REG_NO} arrived at destination hub`);
                    }
                    // Update position
                    const wps = await getWaypoints(s.routeId);
                    const pos = interpolatePosition(wps, Math.min(pct, 100));
                    if (pos) {
                        await db.executeRaw(
                            `UPDATE trip SET current_lat=:1, current_lng=:2, progress_pct=:3 WHERE trip_id=:4`,
                            [pos.lat.toFixed(6), pos.lng.toFixed(6), pct.toFixed(2), tripId]
                        );
                    }
                    break;
                }
                case 'food_stop':
                case 'sleep_stop': {
                    s.timer -= 1;
                    if (s.timer <= 0) {
                        const wasStop = s.phase;
                        s.phase = 'transit';
                        const dn = await db.executeRaw(`SELECT first_name||' '||last_name AS n FROM driver WHERE driver_id=:1`, [s.driverId]);
                        const driverName = dn.rows[0]?.N || 'Driver';
                        await addNotification('🚛 Resumed', `${driverName} resumed journey after ${wasStop === 'food_stop' ? 'meal' : 'rest'}`, 'info');
                        await addTimeline(tripId, '🚛 Resumed', `${driverName} resumed journey after ${wasStop === 'food_stop' ? 'meal break' : 'mandatory rest'}`);
                    }
                    break;
                }
                case 'arrived': {
                    s.timer -= 1;
                    if (s.timer <= 0) {
                        s.phase = 'unloading'; s.timer = randInt(20, 35);
                        await db.executeRaw(`UPDATE load SET status='Unloading' WHERE trip_id=:1 AND status='In Transit'`, [tripId]);
                        await addNotification('📤 Unloading', `Cargo being unloaded at destination dock.`, 'info');
                        await addTimeline(tripId, '📤 Unloading', `Cargo being unloaded at destination dock`);
                    }
                    break;
                }
                case 'unloading': {
                    s.timer -= 1;
                    if (s.timer <= 0) {
                        s.phase = 'delivered'; s.timer = randInt(25, 40);
                        await db.executeRaw(`UPDATE load SET status='Delivered', actual_delivery=SYSTIMESTAMP WHERE trip_id=:1 AND status='Unloading'`, [tripId]);
                        await addNotification('✅ Delivered', `Load delivered successfully.`, 'delivery');
                        await addTimeline(tripId, '✅ Delivered', `Load delivered and signed off successfully`);
                    }
                    break;
                }
                case 'delivered': {
                    s.timer -= 1;
                    if (s.timer <= 0) {
                        // Find reverse route for next journey
                        const rev = await db.executeRaw(
                            `SELECT route_id, distance_km, origin_hub_id, dest_hub_id FROM route
                             WHERE origin_hub_id = :1 AND dest_hub_id = :2 AND is_active = 1 FETCH FIRST 1 ROWS ONLY`,
                            [s.destHub, s.originHub]
                        );
                        let newRoute, newDist, newOrig, newDest;
                        if (rev.rows.length) {
                            newRoute = rev.rows[0].ROUTE_ID; newDist = rev.rows[0].DISTANCE_KM;
                            newOrig = rev.rows[0].ORIGIN_HUB_ID; newDest = rev.rows[0].DEST_HUB_ID;
                        } else {
                            const any = await db.executeRaw(
                                `SELECT route_id, distance_km, origin_hub_id, dest_hub_id FROM route
                                 WHERE origin_hub_id = :1 AND is_active = 1 ORDER BY DBMS_RANDOM.VALUE FETCH FIRST 1 ROWS ONLY`, [s.destHub]
                            );
                            if (!any.rows.length) { s.phase = 'transit'; break; }
                            newRoute = any.rows[0].ROUTE_ID; newDist = any.rows[0].DISTANCE_KM;
                            newOrig = any.rows[0].ORIGIN_HUB_ID; newDest = any.rows[0].DEST_HUB_ID;
                        }
                        // Store next route info for later phases
                        s._nextRoute = newRoute; s._nextDist = newDist;
                        s._nextOrig = newOrig; s._nextDest = newDest;
                        // Move load to Unassigned (new consignment planned)
                        s.phase = 'unassigned'; s.timer = randInt(20, 35);
                        await db.executeRaw(`UPDATE load SET status='Unassigned', pickup_hub_id=:1, dropoff_hub_id=:2, actual_delivery=NULL WHERE trip_id=:3`, [newOrig, newDest, tripId]);
                        await addNotification('📋 New Load Created', `New consignment ready for assignment.`, 'info');
                        await addTimeline(tripId, '📋 New Load', `New consignment created and awaiting assignment`);
                    }
                    break;
                }
                case 'unassigned': {
                    s.timer -= 1;
                    if (s.timer <= 0) {
                        // If no next route cached (first run from startup stagger), find one
                        if (!s._nextRoute) {
                            const rev = await db.executeRaw(
                                `SELECT route_id, distance_km, origin_hub_id, dest_hub_id FROM route
                                 WHERE origin_hub_id = :1 AND is_active = 1 ORDER BY DBMS_RANDOM.VALUE FETCH FIRST 1 ROWS ONLY`, [s.destHub || s.originHub]);
                            if (rev.rows.length) {
                                s._nextRoute = rev.rows[0].ROUTE_ID; s._nextDist = rev.rows[0].DISTANCE_KM;
                                s._nextOrig = rev.rows[0].ORIGIN_HUB_ID; s._nextDest = rev.rows[0].DEST_HUB_ID;
                            }
                        }
                        // Swap driver
                        const pair = driverPairs[s.tractorId] || [s.driverId, s.driverId];
                        const newDriver = pair[0] === s.driverId ? pair[1] : pair[0];
                        s._newDriver = newDriver;
                        s.phase = 'assigned'; s.timer = randInt(15, 25);
                        await db.executeRaw(`UPDATE load SET status='Assigned' WHERE trip_id=:1`, [tripId]);
                        const dn = await db.executeRaw(`SELECT first_name||' '||last_name AS n FROM driver WHERE driver_id=:1`, [newDriver]);
                        const oldDn = await db.executeRaw(`SELECT first_name||' '||last_name AS n FROM driver WHERE driver_id=:1`, [s.driverId]);
                        const tr = await db.executeRaw(`SELECT reg_no FROM tractor WHERE tractor_id=:1`, [s.tractorId]);
                        await addNotification('🔗 Assigned', `${tr.rows[0]?.REG_NO} assigned to ${dn.rows[0]?.N}`, 'info');
                        await addTimeline(tripId, '🔗 Assigned', `Assigned to driver ${dn.rows[0]?.N}. Previous driver ${oldDn.rows[0]?.N} now resting`);
                    }
                    break;
                }
                case 'assigned': {
                    s.timer -= 1;
                    if (s.timer <= 0) {
                        s.phase = 'loading'; s.timer = randInt(15, 25);
                        await db.executeRaw(`UPDATE load SET status='Loading' WHERE trip_id=:1`, [tripId]);
                        await addNotification('📦 Loading', `Truck being loaded at hub dock.`, 'info');
                        await addTimeline(tripId, '📦 Loading', `Cargo being loaded onto truck at hub dock`);
                    }
                    break;
                }
                case 'loading': {
                    s.timer -= 1;
                    if (s.timer <= 0) {
                        const newDriver = s._newDriver || s.driverId;
                        const newRoute = s._nextRoute || s.routeId;
                        const newDist = s._nextDist || s.distKm;
                        const newOrig = s._nextOrig || s.originHub;
                        const newDest = s._nextDest || s.destHub;
                        // Update trip for new journey
                        const startWps = await getWaypoints(newRoute);
                        const startPos = startWps.length ? startWps[0] : { LATITUDE: 20, LONGITUDE: 78 };
                        await db.executeRaw(
                            `UPDATE trip SET route_id=:1, driver_id=:2, progress_pct=0, current_lat=:3, current_lng=:4 WHERE trip_id=:5`,
                            [newRoute, newDriver, startPos.LATITUDE, startPos.LONGITUDE, tripId]
                        );
                        await db.executeRaw(`UPDATE load SET status='In Transit' WHERE trip_id=:1`, [tripId]);
                        await db.executeRaw(`UPDATE driver SET status='On Trip' WHERE driver_id=:1`, [newDriver]);
                        await db.executeRaw(`UPDATE driver SET status='On Rest' WHERE driver_id=:1`, [s.driverId]);

                        const dn = await db.executeRaw(`SELECT first_name||' '||last_name AS n FROM driver WHERE driver_id=:1`, [newDriver]);
                        const tr = await db.executeRaw(`SELECT reg_no FROM tractor WHERE tractor_id=:1`, [s.tractorId]);
                        await addNotification('🚛 Departed',
                            `${tr.rows[0]?.REG_NO} departed with new consignment. Driver: ${dn.rows[0]?.N}`, 'info');
                        await addTimeline(tripId, '🚛 Departed', `${tr.rows[0]?.REG_NO} departed. Driver: ${dn.rows[0]?.N}`);

                        s.phase = 'transit'; s.driverId = newDriver; s.routeId = newRoute;
                        s.distKm = newDist || 800; s.originHub = newOrig; s.destHub = newDest;
                        s.simMin = 0; s.nextFood = randInt(180, 300); s.nextSleep = randInt(480, 660);
                        delete s._nextRoute; delete s._nextDist; delete s._nextOrig; delete s._nextDest; delete s._newDriver;
                    }
                    break;
                }
            }
        } catch (e) { /* continue */ }
    }
}

// Expose sim state for frontend
app.get('/api/tracking/sim-state', (req, res) => {
    const states = {};
    for (const [id, s] of Object.entries(simTrips)) {
        states[id] = { phase: s.phase, timer: s.timer, simMin: Math.round(s.simMin) };
    }
    res.json(states);
});

// ==================== START ====================
async function start() {
    try {
        await db.initialize();
        server.listen(PORT, () => {
            console.log(`🚀 Fleet Force server running at http://localhost:${PORT}`);
            console.log(`📡 WebSocket at ws://localhost:${PORT}/ws`);
        });
        await initSimulation();
        setInterval(simulationTick, TICK_MS);
    } catch (err) {
        console.error('Failed to start:', err.message);
        process.exit(1);
    }
}

start();
