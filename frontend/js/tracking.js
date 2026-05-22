// Fleet Force — Routes & Tracking Page
let trackingMap = null;
let trackMarkers = {};
let trackRouteLines = {};
let trackRefreshInterval = null;
let selectedRouteId = null;

window.render_tracking = async function(container) {
    // Cleanup previous
    if (trackRefreshInterval) { clearInterval(trackRefreshInterval); trackRefreshInterval = null; }
    if (trackingMap) { trackingMap.remove(); trackingMap = null; }
    trackMarkers = {};
    trackRouteLines = {};

    container.innerHTML = `
        <div style="display:flex;gap:16px;height:calc(100vh - var(--header-height) - 48px)">
            <div style="flex:1;display:flex;flex-direction:column;gap:16px">
                <div class="card" style="flex:1;padding:0;overflow:hidden;position:relative;min-height:500px">
                    <div style="position:absolute;top:12px;left:12px;z-index:10;background:var(--bg-overlay);padding:6px 14px;border-radius:var(--radius-sm);font-size:11px;font-weight:600;color:var(--text-secondary);backdrop-filter:blur(8px);border:1px solid var(--border)">
                        🟢 LIVE TRACKING — <span id="track-vehicle-count">0</span> vehicles on <span id="track-route-count">0</span> routes
                    </div>
                    <div style="position:absolute;top:12px;right:12px;z-index:10;display:flex;gap:6px">
                        <button class="btn btn-primary" id="track-fit-btn" style="font-size:11px;padding:5px 10px">🗺️ Fit All</button>
                        <button class="btn" id="track-clear-btn" style="font-size:11px;padding:5px 10px">✕ Clear Selection</button>
                    </div>
                    <div id="tracking-map" style="height:100%"></div>
                </div>
            </div>
            <div style="width:340px;display:flex;flex-direction:column;gap:16px">
                <div class="card" style="padding:14px">
                    <div class="card-header" style="margin-bottom:10px"><div class="card-title" style="font-size:13px">📊 Tracking Stats</div></div>
                    <div class="grid grid-2" id="tracking-stats" style="gap:8px">
                        <div class="stat-mini"><span class="stat-label">In Transit</span><span class="stat-value" id="stat-transit">0</span></div>
                        <div class="stat-mini"><span class="stat-label">Total Routes</span><span class="stat-value" id="stat-routes">0</span></div>
                        <div class="stat-mini"><span class="stat-label">Avg Progress</span><span class="stat-value" id="stat-avg-progress">0%</span></div>
                        <div class="stat-mini"><span class="stat-label">Active Hubs</span><span class="stat-value" id="stat-hubs">6</span></div>
                    </div>
                </div>
                <div class="card" style="flex:1;overflow-y:auto;padding:0">
                    <div class="card-header" style="padding:14px 14px 10px"><div class="card-title" style="font-size:13px">🛣️ Active Routes</div></div>
                    <div id="route-list" style="padding:0 8px 8px"></div>
                </div>
                <div class="card" style="flex:1;overflow-y:auto;padding:0;display:none" id="vehicle-panel">
                    <div class="card-header" style="padding:14px 14px 10px"><div class="card-title" style="font-size:13px">🚛 Vehicles on Route</div></div>
                    <div id="vehicle-list" style="padding:0 8px 8px"></div>
                </div>
            </div>
        </div>
    `;

    initTrackingMap();
    loadRouteList();
    loadTrackingVehicles();
    trackRefreshInterval = setInterval(loadTrackingVehicles, 3000);

    document.getElementById('track-fit-btn').addEventListener('click', () => {
        if (trackingMap) trackingMap.setView([20.5, 78.9], 5);
    });
    document.getElementById('track-clear-btn').addEventListener('click', () => {
        selectedRouteId = null;
        Object.values(trackRouteLines).forEach(l => l.setStyle({ weight: 2, opacity: 0.35 }));
        document.getElementById('vehicle-panel').style.display = 'none';
        document.querySelectorAll('.route-item').forEach(r => r.classList.remove('active'));
        if (trackingMap) trackingMap.setView([20.5, 78.9], 5);
    });
};

function initTrackingMap() {
    trackingMap = L.map('tracking-map', {
        center: [20.5, 78.9], zoom: 5,
        zoomControl: false, attributionControl: false
    });
    L.control.zoom({ position: 'bottomright' }).addTo(trackingMap);

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
    }).addTo(trackingMap);
    tileLayer.getContainer().classList.add('dark-tiles');

    // Hub markers
    const hubs = [
        { name: 'Mangaluru', lat: 12.9141, lng: 74.8560, code: 'M' },
        { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, code: 'B' },
        { name: 'Mumbai', lat: 19.0760, lng: 72.8777, code: 'Mu' },
        { name: 'Chennai', lat: 13.0827, lng: 80.2707, code: 'C' },
        { name: 'Delhi', lat: 28.7041, lng: 77.1025, code: 'D' },
        { name: 'Kolkata', lat: 22.5726, lng: 88.3639, code: 'K' }
    ];
    hubs.forEach(h => {
        const icon = L.divIcon({
            className: 'truck-marker',
            html: `<div class="hub-marker">${h.code}</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14]
        });
        L.marker([h.lat, h.lng], { icon }).addTo(trackingMap)
            .bindPopup(`<strong>${h.name} Hub</strong><br>Fleet Force Logistics`);
    });
}

async function loadTrackingVehicles() {
    try {
        const res = await fetch(`${API}/tracking/positions`);
        const vehicles = await res.json();
        const countEl = document.getElementById('track-vehicle-count');
        if (countEl) countEl.textContent = vehicles.length;
        document.getElementById('stat-transit').textContent = vehicles.length;
        const avgProg = vehicles.length ? (vehicles.reduce((s, v) => s + (v.PROGRESS_PCT || 0), 0) / vehicles.length).toFixed(1) : 0;
        document.getElementById('stat-avg-progress').textContent = avgProg + '%';

        const colors = ['blue', 'teal', 'orange', 'pink'];
        vehicles.forEach((v, i) => {
            const color = colors[i % colors.length];
            const lat = parseFloat(v.CURRENT_LAT), lng = parseFloat(v.CURRENT_LNG);
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

            const popupContent = `
                <strong>🚛 ${v.REG_NO}</strong><br>
                ${v.TRUCK_NAME || ''}<br>
                👤 ${v.DRIVER_NAME}<br>
                📦 ${v.LOAD_CODE || 'N/A'} — ${v.CARGO_DESC || ''}<br>
                📍 ${v.FROM_CITY} → ${v.TO_CITY}<br>
                <span style="color:#14b8a6">${(v.PROGRESS_PCT || 0).toFixed(1)}% complete</span>
            `;

            if (trackMarkers[v.TRIP_ID]) {
                trackMarkers[v.TRIP_ID].setLatLng([lat, lng]);
                trackMarkers[v.TRIP_ID].setPopupContent(popupContent);
            } else {
                const icon = L.divIcon({
                    className: 'truck-marker',
                    html: `<div class="truck-dot ${color}"></div>`,
                    iconSize: [14, 14], iconAnchor: [7, 7]
                });
                trackMarkers[v.TRIP_ID] = L.marker([lat, lng], { icon }).addTo(trackingMap);
                trackMarkers[v.TRIP_ID].bindPopup(popupContent);
            }
        });

        // Load route polylines (once)
        if (Object.keys(trackRouteLines).length === 0) {
            const routeIds = [...new Set(vehicles.map(v => v.ROUTE_ID).filter(Boolean))];
            document.getElementById('track-route-count').textContent = routeIds.length;
            document.getElementById('stat-routes').textContent = routeIds.length;
            for (const routeId of routeIds) {
                try {
                    const r = await fetch(`${API}/routes/${routeId}/waypoints`);
                    const wps = await r.json();
                    if (wps.length < 2) continue;
                    const latlngs = wps.map(w => [w.LATITUDE, w.LONGITUDE]);
                    trackRouteLines[routeId] = L.polyline(latlngs, {
                        color: '#14b8a6', weight: 2, opacity: 0.35, dashArray: '6,8'
                    }).addTo(trackingMap);
                } catch (e) {}
            }
        }

        // Update vehicle panel if a route is selected
        if (selectedRouteId) {
            const routeVehicles = vehicles.filter(v => v.ROUTE_ID === selectedRouteId);
            renderVehicleList(routeVehicles);
        }
    } catch (e) {}
}

async function loadRouteList() {
    try {
        const res = await fetch(`${API}/routes`);
        const routes = await res.json();
        const list = document.getElementById('route-list');
        list.innerHTML = routes.map(r => `
            <div class="route-item card" data-route-id="${r.ROUTE_ID}" onclick="selectRoute(${r.ROUTE_ID})" style="padding:10px 12px;margin-bottom:6px;cursor:pointer;transition:all 0.15s">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
                    <div style="font-size:12px;font-weight:700">${r.ROUTE_NAME}</div>
                </div>
                <div style="font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:4px;margin-bottom:4px">
                    📍 ${r.ORIGIN_CITY} → ${r.DEST_CITY}
                </div>
                <div style="display:flex;gap:12px;font-size:10px;color:var(--text-muted)">
                    <span>🛣️ ${r.DISTANCE_KM ? Number(r.DISTANCE_KM).toLocaleString() + ' km' : '—'}</span>
                    <span>⏱️ ~${r.EST_HOURS || '?'}h</span>
                </div>
            </div>
        `).join('');
    } catch (e) {}
}

window.selectRoute = async function(routeId) {
    selectedRouteId = routeId;

    // Highlight selected route
    document.querySelectorAll('.route-item').forEach(r => {
        r.classList.toggle('active', parseInt(r.dataset.routeId) === routeId);
    });

    // Bold the polyline
    Object.entries(trackRouteLines).forEach(([id, line]) => {
        if (parseInt(id) === routeId) {
            line.setStyle({ weight: 4, opacity: 0.9, dashArray: null });
            trackingMap.fitBounds(line.getBounds(), { padding: [40, 40] });
        } else {
            line.setStyle({ weight: 2, opacity: 0.2, dashArray: '6,8' });
        }
    });

    // Show vehicle panel
    document.getElementById('vehicle-panel').style.display = 'block';

    // Fetch vehicles on this route
    try {
        const res = await fetch(`${API}/tracking/positions`);
        const vehicles = await res.json();
        const routeVehicles = vehicles.filter(v => v.ROUTE_ID === routeId);
        renderVehicleList(routeVehicles);
    } catch (e) {}
};

function renderVehicleList(vehicles) {
    const list = document.getElementById('vehicle-list');
    if (!vehicles.length) {
        list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px">No vehicles on this route currently</div>';
        return;
    }
    list.innerHTML = vehicles.map(v => `
        <div class="card" style="padding:10px 12px;margin-bottom:6px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
                <div>
                    <div style="font-size:12px;font-weight:700;font-family:var(--font-mono)">${v.REG_NO}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${v.TRUCK_NAME || ''}</div>
                </div>
                <span style="font-size:10px;font-weight:600;color:var(--accent-teal)">${(v.PROGRESS_PCT || 0).toFixed(1)}%</span>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">👤 ${v.DRIVER_NAME}</div>
            <div style="font-size:10px;color:var(--text-muted)">📦 ${v.LOAD_CODE || '—'}</div>
            <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-top:6px">
                <div style="height:100%;width:${v.PROGRESS_PCT || 0}%;background:var(--accent-teal);border-radius:2px;transition:width 0.5s"></div>
            </div>
        </div>
    `).join('');
}
