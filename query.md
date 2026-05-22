# 🗄️ Fleet Force — SQL Demo Queries for Teacher Presentation

> **How to use this guide**: Run queries in the **SQL Terminal** inside the app (http://localhost:3000 → SQL Terminal page). The terminal now supports SELECT, INSERT, UPDATE, and DELETE.
>
> You can **also** open **SQL Developer**, connect to the **"dbms project"** connection, and run the same queries there. Changes will reflect in the frontend when you navigate to the relevant page.

---

## 🔁 Demo Flow (Recommended Order)

The idea is simple:
1. **Show BEFORE state** on the frontend page
2. **Run the query** (from SQL Terminal or SQL Developer)
3. **Switch to the frontend page** and show the change happened live

---

## 📋 DEMO 1: UPDATE a Driver's Name (Drivers Page)

### Step 1 — See the BEFORE state
```sql
SELECT driver_id, first_name, last_name, phone, status FROM driver WHERE driver_id = 1
```
> Note the name. Now go to the **Drivers** page and spot this driver's card.

### Step 2 — UPDATE the name
```sql
UPDATE driver SET first_name = 'Rahul', last_name = 'Sharma' WHERE driver_id = 1
```
> ✅ 1 row(s) affected

### Step 3 — Verify with SELECT
```sql
SELECT driver_id, first_name, last_name, phone, status FROM driver WHERE driver_id = 1
```
> Shows: Rahul Sharma

### Step 4 — Go to Drivers page
Navigate to **Drivers** page in the sidebar. The card that previously showed the old name now shows **"Rahul Sharma"**.

### Step 5 — Revert (after demo)
```sql
UPDATE driver SET first_name = 'Vikram', last_name = 'Nair' WHERE driver_id = 1
```

---

## 📋 DEMO 2: UPDATE Customer Company Name (Billing Page)

### Step 1 — See BEFORE
```sql
SELECT customer_id, company_name, email FROM customer
```

### Step 2 — Update a company name
```sql
UPDATE customer SET company_name = 'Flipkart Logistics Pvt Ltd' WHERE customer_id = 1
```

### Step 3 — Verify
```sql
SELECT customer_id, company_name, email FROM customer WHERE customer_id = 1
```

### Step 4 — Go to Billing page
The invoice table will now show **"Flipkart Logistics Pvt Ltd"** instead of the old name.

### Step 5 — Revert
```sql
UPDATE customer SET company_name = 'Hindusthan Oil Corporation' WHERE customer_id = 1
```

---

## 📋 DEMO 3: UPDATE Warehouse Capacity (Warehouses Page)

### Step 1 — See BEFORE
```sql
SELECT warehouse_id, warehouse_name, capacity_pct, current_stock, total_capacity FROM warehouse WHERE warehouse_id = 1
```

### Step 2 — Change the capacity to nearly full (will turn red in UI!)
```sql
UPDATE warehouse SET capacity_pct = 95.5, current_stock = 47750 WHERE warehouse_id = 1
```

### Step 3 — Verify
```sql
SELECT warehouse_id, warehouse_name, capacity_pct, current_stock FROM warehouse WHERE warehouse_id = 1
```

### Step 4 — Go to Warehouses page
The first warehouse card's capacity bar is now **95.5% and RED** (it was ~72% green before).

### Step 5 — Revert
```sql
UPDATE warehouse SET capacity_pct = 72.5, current_stock = 36250 WHERE warehouse_id = 1
```

---

## 📋 DEMO 4: UPDATE Invoice Status (Billing Page)

### Step 1 — See pending invoices
```sql
SELECT invoice_id, invoice_no, net_amount, status FROM invoice WHERE status = 'Pending'
```

### Step 2 — Mark an invoice as Paid
```sql
UPDATE invoice SET status = 'Paid' WHERE invoice_no = 'INV-2026-008'
```

### Step 3 — Verify
```sql
SELECT invoice_no, status FROM invoice WHERE invoice_no = 'INV-2026-008'
```

### Step 4 — Go to Billing page
The invoice now shows a **green "Paid" badge** instead of yellow "Pending". The KPI cards also update — Paid amount goes up, Pending goes down.

### Step 5 — Revert
```sql
UPDATE invoice SET status = 'Pending' WHERE invoice_no = 'INV-2026-008'
```

---

## 📋 DEMO 5: INSERT a New Customer (SQL Terminal → Billing/Reports)

### Step 1 — Count existing customers
```sql
SELECT COUNT(*) AS total_customers FROM customer
```

### Step 2 — Insert a new customer
```sql
INSERT INTO customer (company_name, contact_person, email, phone, gst_no, contract_type) VALUES ('TCS Supply Chain Ltd', 'Natarajan Chandrasekaran', 'tcs@logistics.in', '9876543210', '27AABCT1234L1Z5', 'Premium')
```

### Step 3 — Verify
```sql
SELECT customer_id, company_name, email, contract_type FROM customer ORDER BY customer_id DESC
```
> The new customer **"TCS Supply Chain Ltd"** appears at the top.

### Step 4 — Show in Reports page
Go to **Reports** → the **Revenue by Customer** doughnut chart will include the new customer once invoices are linked.

### Step 5 — Cleanup
```sql
DELETE FROM customer WHERE company_name = 'TCS Supply Chain Ltd'
```

---

## 📋 DEMO 6: INSERT a Notification (Bell Icon)

### Step 1 — Check current notification count (top-right bell icon)

### Step 2 — Insert a notification
```sql
INSERT INTO notification (title, message, notif_type, is_read) VALUES ('System Alert', 'Database maintenance scheduled for tonight at 11 PM IST', 'warning', 0)
```

### Step 3 — Click the bell icon 🔔
Your new notification **"System Alert — Database maintenance scheduled..."** appears at the top of the dropdown.

### Step 4 — Delete it
```sql
DELETE FROM notification WHERE title = 'System Alert' AND message LIKE '%Database maintenance%'
```

### Step 5 — Bell icon count drops by 1

---

## 📋 DEMO 7: DELETE a Warehouse (Warehouses Page)

### Step 1 — Count warehouses
```sql
SELECT COUNT(*) AS total FROM warehouse
```
> Shows 22

### Step 2 — Delete the last warehouse
```sql
DELETE FROM warehouse WHERE warehouse_id = 22
```

### Step 3 — Verify
```sql
SELECT COUNT(*) AS total FROM warehouse
```
> Shows 21. The **Warehouses** page now shows 21 cards and the KPI says "Total Warehouses: 21".

### Step 4 — Re-insert it
```sql
INSERT INTO warehouse (warehouse_id, warehouse_name, wh_type, hub_id, address, area_sqft, is_temp_ctld, capacity_pct, total_capacity, current_stock, dock_count, dock_available, status, manager_name, contact_phone, inbound_today, outbound_today) VALUES (22, 'Delhivery Mumbai Mega Hub', 'Warehouse', 3, 'Panvel Logistics Hub', 62000, 0, 82.5, 70000, 57750, 10, 7, 'Active', 'Kapil Bharati', '9900020021', 70, 62)
```

---

## 📋 DEMO 8: UPDATE Driver Rating (Drivers Page)

### Step 1 — See current rating
```sql
SELECT driver_id, first_name, last_name, driver_rating FROM driver WHERE driver_id = 3
```

### Step 2 — Change rating to 5.0 (perfect!)
```sql
UPDATE driver SET driver_rating = 5.0 WHERE driver_id = 3
```

### Step 3 — Go to Drivers page
Click on that driver's card → the detail panel shows **Rating: 5.0** with a full star display.

### Step 4 — Revert
```sql
UPDATE driver SET driver_rating = 4.9 WHERE driver_id = 3
```

---

## 📋 DEMO 9: Show Location Data in Database

### Hub locations (latitude/longitude):
```sql
SELECT hub_id, city, state, latitude, longitude FROM hub
```
> This shows all 6 hub coordinates — these are used to place markers on the map.

### Route waypoints (GPS path):
```sql
SELECT route_id, seq_no, latitude, longitude, place_name FROM route_waypoint WHERE route_id = 1 ORDER BY seq_no
```
> Shows the GPS path trucks follow on the Mangaluru → Bengaluru route.

### Live truck positions:
```sql
SELECT t.trip_id, tr.reg_no, t.current_lat, t.current_lng, t.progress_pct, t.status FROM trip t JOIN tractor tr ON t.tractor_id = tr.tractor_id WHERE t.status = 'In Transit'
```
> Shows real-time latitude/longitude of all trucks currently on the road. These update every 3 seconds by the simulation engine.

### Update a hub's coordinates (careful — for demo only):
```sql
UPDATE hub SET latitude = 12.9716, longitude = 77.5946 WHERE hub_id = 2
```
> This is Bengaluru's coordinates — changing it would move the hub marker on the map.

---

## 🖥️ Where to Run Queries

### Option A: In-App SQL Terminal (Recommended for demo)
1. Open http://localhost:3000
2. Navigate to **SQL Terminal** in the sidebar
3. Type or paste the query
4. Press **▶ Run Query** or **Ctrl + Enter**
5. See results immediately + it appears in the **Live SQL Log**

### Option B: SQL Developer
1. Open **Oracle SQL Developer**
2. Connect to: **"dbms project"** connection
   - Host: `localhost`
   - Port: `1521`
   - Service: `FREEPDB1`
   - User: `fleet_force`
   - Password: `Daring_DG?211`
3. Run the query
4. **IMPORTANT**: After INSERT/UPDATE/DELETE, run `COMMIT;`
5. Switch to the browser and navigate to the relevant page to see the change

> ⚠️ SQL Developer requires `COMMIT;` after write queries. The in-app terminal auto-commits.

---

## 🎤 What to Say to Your Teacher

### When showing DB → Frontend:
> *"I'm updating a driver's name directly in the database. Now when I go to the Drivers page, you can see the name has changed — because the frontend fetches data live from Oracle every time the page loads."*

### When showing Frontend → DB:
> *"Our SQL Terminal page lets me run queries against the live Oracle database. I'm inserting a new notification — and when I click the bell icon, it shows up immediately. The data flows both ways."*

### When showing the Live SQL Log:
> *"Every query the application runs — whether it's loading the dashboard, fetching drivers, or updating truck positions — gets logged in the query_log table. You can see them scrolling in real-time in this Live SQL Log panel."*

### When showing locations:
> *"All hub locations are stored with latitude and longitude in the hub table. Route waypoints have GPS coordinates for each turn point on the highway. The simulation engine calculates truck positions by interpolating along these waypoints, and updates the trip table every 3 seconds."*

---

## ✅ Quick Checklist for Demo Day

- [ ] Oracle DB is running (`FREEPDB1` service)
- [ ] Backend is running (`cd backend && node server.js`)
- [ ] Open http://localhost:3000 in Chrome
- [ ] Login as `admin` / `admin123`
- [ ] SQL Developer open with "dbms project" connection (optional)
- [ ] This file (`query.md`) open for reference
- [ ] Demo order: UPDATE driver → UPDATE warehouse → INSERT notification → DELETE warehouse → Show locations → Show Live SQL Log
