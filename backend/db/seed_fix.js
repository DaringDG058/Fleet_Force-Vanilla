// Fleet Force — Fix remaining seed data (contracts, orders, trips, loads, invoices)
const oracledb = require('oracledb');

const DB_CONFIG = {
    user: 'fleet_force',
    password: 'Daring_DG?211',
    connectString: 'localhost:1521/FREEPDB1'
};

async function main() {
    const conn = await oracledb.getConnection(DB_CONFIG);
    console.log('Connected. Fixing seed data...');

    // Clear dependent tables first
    for (const t of ['LOAD_TIMELINE','LOAD_NOTE','LOAD_DOCUMENT','INVOICE','LOAD','ORDERS','TRIP','CONTRACT','NOTIFICATION','MAINTENANCE']) {
        try { await conn.execute(`DELETE FROM ${t}`); } catch(e) {}
    }
    await conn.commit();

    // Insert contracts
    const contracts = [
        [1,'Hindusthan Oil - Tanker','2025-01-01','2026-12-31','Gold',45.50,285000],
        [2,'Sketchers - Flatbed','2025-02-01','2026-12-31','Silver',38.75,342000],
        [3,'Havmor - Refrigerated','2025-03-01','2026-12-31','Gold',52.00,198000],
        [4,'Lohan Fisheries - Reefer','2025-01-15','2026-12-31','Gold',55.00,210000],
        [5,'Phillips - DRY Van','2025-02-15','2026-12-31','Silver',42.00,456000],
        [6,'Ekart - DRY Van Long Haul','2025-01-01','2026-12-31','Platinum',48.50,520000],
        [7,'Shiprocket - DRY Van','2025-03-15','2026-12-31','Silver',41.00,380000],
        [8,'Jio Oil - Tanker','2025-02-01','2026-12-31','Gold',47.00,312000],
        [9,'Sohan Industries - Flatbed','2025-01-15','2026-12-31','Silver',39.50,298000],
        [10,'Patil Freight - Flatbed','2025-04-01','2026-12-31','Silver',40.00,356000],
        [11,'Delhivery - Double','2025-01-01','2026-12-31','Platinum',55.00,425000],
        [12,'Karan Pvt Ltd - Low Boy','2026-04-01','2026-06-30','Standard',85.00,180000],
        [13,'Neeraj Auto - Car Hauler','2026-04-15','2026-06-30','Standard',72.00,145000]
    ];
    const contractIds = {};
    for (const c of contracts) {
        const r = await conn.execute(
            `INSERT INTO contract (customer_id, contract_name, start_date, end_date, sla_tier, rate_per_km, monthly_value, status)
             VALUES (:1, :2, TO_DATE(:3,'YYYY-MM-DD'), TO_DATE(:4,'YYYY-MM-DD'), :5, :6, :7, 'Active') RETURNING contract_id INTO :8`,
            [c[0], c[1], c[2], c[3], c[4], c[5], c[6], {type: oracledb.NUMBER, dir: oracledb.BIND_OUT}]
        );
        contractIds[c[0]] = r.outBinds[0][0];
    }
    console.log('✅ 13 contracts inserted');

    // 19 trips: [routeId, tractorId, trailerId, driverId, hoursAgo, hoursRemaining, fuelL, distKm, lat, lng, progressPct]
    const trips = [
        [1,1,20,1,3,4,45.2,150,12.65,76.20,42.8],
        [3,13,1,13,5,8,82.5,310,12.40,77.80,50.0],
        [4,4,2,4,2,11,28.0,100,13.00,79.50,16.1],
        [5,8,17,7,4,3,58.3,245,12.50,78.90,70.0],
        [6,10,18,8,1,6,15.0,55,13.00,80.00,15.7],
        [7,18,9,15,8,14,105.0,490,15.50,76.30,36.6],
        [8,9,10,9,6,16,78.5,365,17.20,75.40,27.2],
        [9,2,11,2,12,24,165.0,720,17.80,76.50,33.5],
        [10,5,12,5,10,26,135.0,600,24.50,77.80,27.9],
        [11,16,13,11,7,9,92.0,430,15.20,75.90,43.9],
        [12,3,14,3,4,12,52.0,245,17.50,76.10,25.0],
        [13,6,21,6,9,15,120.0,550,25.10,82.50,37.4],
        [14,11,3,10,11,13,148.0,670,26.20,81.30,45.6],
        [13,19,4,17,6,18,82.0,370,24.80,84.20,25.2],
        [15,12,5,12,14,17,185.0,840,18.30,80.50,44.9],
        [16,21,6,18,8,23,105.0,480,16.70,79.80,25.7],
        [11,20,25,19,5,11,68.0,305,15.80,75.60,31.1],
        [17,15,23,14,10,14,132.0,590,22.40,76.90,41.5],
        [12,17,24,16,6,10,78.0,370,16.30,75.80,37.8]
    ];
    const tripIds = [];
    for (const t of trips) {
        const r = await conn.execute(
            `INSERT INTO trip (route_id, tractor_id, trailer_id, driver_id,
                planned_start, actual_start, planned_end, status,
                fuel_consumed_l, distance_km, current_lat, current_lng, progress_pct)
             VALUES (:1,:2,:3,:4,
                SYSTIMESTAMP - NUMTODSINTERVAL(:5,'HOUR'), SYSTIMESTAMP - NUMTODSINTERVAL(:5,'HOUR'),
                SYSTIMESTAMP + NUMTODSINTERVAL(:6,'HOUR'), 'In Transit',
                :7,:8,:9,:10,:11) RETURNING trip_id INTO :12`,
            [t[0],t[1],t[2],t[3],t[4],t[4],t[5],t[6],t[7],t[8],t[9],t[10],
             {type:oracledb.NUMBER, dir:oracledb.BIND_OUT}]
        );
        tripIds.push(r.outBinds[0][0]);
    }
    console.log(`✅ ${tripIds.length} trips inserted`);

    // 19 orders
    const orderData = [
        [1,1,30000,'High'],[2,2,8500,'Medium'],[2,2,8200,'Medium'],[3,3,5000,'High'],
        [4,4,12000,'High'],[5,5,15000,'Medium'],[5,5,14500,'Medium'],[6,6,22000,'High'],
        [6,6,21000,'High'],[7,7,18000,'Medium'],[7,7,17500,'Medium'],[8,8,35000,'High'],
        [9,9,12500,'Medium'],[9,9,13000,'Medium'],[10,10,16000,'Medium'],[10,10,15500,'Medium'],
        [11,11,28000,'High'],[12,12,95000,'Critical'],[13,13,65000,'High']
    ];
    const orderIds = [];
    for (const o of orderData) {
        const cid = contractIds[o[0]] || null;
        const r = await conn.execute(
            `INSERT INTO orders (customer_id, contract_id, status, priority, total_weight_kg, order_date, expected_delivery)
             VALUES (:1,:2,'In Transit',:3,:4,SYSTIMESTAMP - INTERVAL '1' DAY, SYSDATE+1) RETURNING order_id INTO :5`,
            [o[0], cid, o[3], o[2], {type:oracledb.NUMBER, dir:oracledb.BIND_OUT}]
        );
        orderIds.push(r.outBinds[0][0]);
    }
    console.log(`✅ ${orderIds.length} orders inserted`);

    // 19 loads
    const loadData = [
        ['LD-2026-001',0,1,0,1,2,'High',159250,18.5,'Crude petroleum oil - 30KL',30000],
        ['LD-2026-002',1,2,1,1,4,'Medium',240100,15.2,'Sketchers footwear - 850 units',8500],
        ['LD-2026-003',2,2,2,4,1,'Medium',240100,15.2,'Sketchers return - 820 units',8200],
        ['LD-2026-004',3,3,3,2,4,'High',182000,22.0,'Havmor ice cream - reefer',5000],
        ['LD-2026-005',4,4,4,4,2,'High',192500,20.5,'Fresh fish - refrigerated',12000],
        ['LD-2026-006',5,5,5,4,3,'Medium',562800,16.8,'Phillips TVs',15000],
        ['LD-2026-007',6,5,6,3,4,'Medium',562800,16.8,'Phillips ACs',14500],
        ['LD-2026-008',7,6,7,2,5,'High',1042500,24.5,'Ekart parcels - 2200 pkgs',22000],
        ['LD-2026-009',8,6,8,5,2,'High',1042500,24.5,'Ekart parcels - 2100 pkgs',21000],
        ['LD-2026-010',9,7,9,2,3,'Medium',401800,18.2,'Shiprocket parcels',18000],
        ['LD-2026-011',10,7,10,3,2,'Medium',401800,18.2,'Shiprocket return',17500],
        ['LD-2026-012',11,8,11,6,5,'High',690900,21.0,'Jio petroleum - 30KL',35000],
        ['LD-2026-013',12,9,12,5,6,'Medium',580650,14.5,'Machinery parts',12500],
        ['LD-2026-014',13,9,13,6,5,'Medium',580650,14.5,'Steel products',13000],
        ['LD-2026-015',14,10,14,6,2,'Medium',748000,16.0,'Patil general freight',16000],
        ['LD-2026-016',15,10,15,2,6,'Medium',748000,16.0,'Return containers',15500],
        ['LD-2026-017',16,11,16,2,3,'High',539000,22.5,'Delhivery express',28000],
        ['LD-2026-018',17,12,17,3,5,'Critical',1207000,28.0,'Heavy crane - Low Boy',95000],
        ['LD-2026-019',18,13,18,3,2,'High',705600,25.5,'8 luxury cars',65000]
    ];
    const loadIds = [];
    for (const l of loadData) {
        const r = await conn.execute(
            `INSERT INTO load (load_code, order_id, customer_id, trip_id, pickup_hub_id, dropoff_hub_id,
                status, priority, rate, margin_pct, cargo_desc, cargo_weight_kg,
                pickup_date, delivery_date)
             VALUES (:1,:2,:3,:4,:5,:6,'In Transit',:7,:8,:9,:10,:11,
                SYSTIMESTAMP - INTERVAL '3' HOUR, SYSTIMESTAMP + INTERVAL '8' HOUR)
             RETURNING load_id INTO :12`,
            [l[0], orderIds[l[1]], l[2], tripIds[l[3]], l[4], l[5], l[6], l[7], l[8], l[9], l[10],
             {type:oracledb.NUMBER, dir:oracledb.BIND_OUT}]
        );
        loadIds.push(r.outBinds[0][0]);
    }
    console.log(`✅ ${loadIds.length} loads inserted`);

    // Timelines for first load
    for (const [evt, desc, h] of [['Load Created','Load created for Hindusthan Oil',24],['Driver Assigned','Driver Rajesh Kumar assigned',22],['Pickup Completed','Cargo loaded at Mangaluru',3],['In Transit','En route to Bengaluru',3]]) {
        await conn.execute(`INSERT INTO load_timeline (load_id, event_type, event_desc, event_time) VALUES (:1,:2,:3,SYSTIMESTAMP - NUMTODSINTERVAL(:4,'HOUR'))`, [loadIds[0], evt, desc, h]);
    }

    // Invoices
    const invData = [
        ['INV-2026-001',0,0,1,159250,28665,187915,30,'Pending'],
        ['INV-2026-002',1,1,2,240100,43218,283318,30,'Pending'],
        ['INV-2026-003',3,3,3,182000,32760,214760,30,'Pending'],
        ['INV-2026-004',7,7,6,1042500,187650,1230150,30,'Pending'],
        ['INV-2026-005',11,11,8,690900,124362,815262,30,'Pending'],
        ['INV-2026-006',16,16,11,539000,97020,636020,15,'Pending'],
        ['INV-2026-007',17,17,12,1207000,217260,1424260,7,'Pending'],
        ['INV-2026-008',18,18,13,705600,127008,832608,15,'Pending']
    ];
    for (const iv of invData) {
        await conn.execute(
            `INSERT INTO invoice (invoice_no, order_id, load_id, customer_id, total_amount, tax_amount, net_amount, due_date, status, payment_terms)
             VALUES (:1,:2,:3,:4,:5,:6,:7,SYSDATE+:8,:9,:10)`,
            [iv[0], orderIds[iv[1]], loadIds[iv[2]], iv[3], iv[4], iv[5], iv[6], iv[7], iv[8], 'Net ' + iv[7]]
        );
    }
    // Past invoices
    await conn.execute(`INSERT INTO invoice (invoice_no, customer_id, total_amount, tax_amount, net_amount, due_date, status, payment_terms) VALUES ('INV-2026-P01',1,145000,26100,171100,SYSDATE-15,'Paid','Net 30')`);
    await conn.execute(`INSERT INTO invoice (invoice_no, customer_id, total_amount, tax_amount, net_amount, due_date, status, payment_terms) VALUES ('INV-2026-P02',6,985000,177300,1162300,SYSDATE-10,'Paid','Net 30')`);
    await conn.execute(`INSERT INTO invoice (invoice_no, customer_id, total_amount, tax_amount, net_amount, due_date, status, payment_terms) VALUES ('INV-2026-P03',11,512000,92160,604160,SYSDATE-5,'Overdue','Net 15')`);
    console.log('✅ 11 invoices inserted');

    // Maintenance
    await conn.execute(`INSERT INTO maintenance (tractor_id,maint_type,maint_date,cost,odometer_reading,service_center,notes,next_due_date) VALUES (1,'Oil Change',DATE '2026-04-15',8500,120000,'Volvo Centre Mangaluru','Routine',DATE '2026-07-15')`);
    await conn.execute(`INSERT INTO maintenance (tractor_id,maint_type,maint_date,cost,odometer_reading,service_center,notes,next_due_date) VALUES (2,'Brake Pads',DATE '2026-03-20',15200,92000,'Volvo Bengaluru','Front+rear',DATE '2026-09-20')`);
    await conn.execute(`INSERT INTO maintenance (tractor_id,maint_type,maint_date,cost,odometer_reading,service_center,notes,next_due_date) VALUES (8,'Engine Tune',DATE '2026-04-01',12000,85000,'Scania Bengaluru','Full diag',DATE '2026-10-01')`);
    await conn.execute(`INSERT INTO maintenance (tractor_id,maint_type,maint_date,cost,odometer_reading,service_center,notes,next_due_date) VALUES (15,'Transmission',DATE '2026-02-28',22500,150000,'Mercedes Mumbai','Gearbox fluid',DATE '2026-08-28')`);

    // Notifications
    await conn.execute(`INSERT INTO notification (user_id,title,message,notif_type) VALUES (1,'Load Delivered','Load LD-2026-P15 delivered to Ekart Delhi Hub','delivery')`);
    await conn.execute(`INSERT INTO notification (user_id,title,message,notif_type) VALUES (1,'Late Pickup','Load LD-2026-005 is 1hr behind schedule','warning')`);
    await conn.execute(`INSERT INTO notification (user_id,title,message,notif_type) VALUES (1,'Temperature Alert','Reefer TRL-RF-001 at -16C (range -18 to -20C)','critical')`);
    await conn.execute(`INSERT INTO notification (user_id,title,message,notif_type) VALUES (1,'Invoice Overdue','INV-2026-P03 Delhivery overdue Rs 6,04,160','warning')`);
    await conn.execute(`INSERT INTO notification (user_id,title,message,notif_type) VALUES (1,'HOS Warning','Driver Bharat Verma near 11hr limit','warning')`);

    await conn.commit();

    // Final verification
    console.log('\n📊 Final Verification:');
    for (const t of ['CONTRACT','ORDERS','TRIP','LOAD','LOAD_TIMELINE','INVOICE','MAINTENANCE','NOTIFICATION']) {
        const r = await conn.execute(`SELECT COUNT(*) FROM ${t}`);
        console.log(`  ${t}: ${r.rows[0][0]} rows`);
    }

    await conn.close();
    console.log('\n🎉 All seed data fixed!');
}

main().catch(e => { console.error(e); process.exit(1); });
