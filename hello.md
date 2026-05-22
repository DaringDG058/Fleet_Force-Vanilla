# 🚛 Fleet Force — Logistics Command Centre

## How to Start the Application

### Prerequisites
- **Node.js** (v18 or later) installed
- **Oracle Database 26ai** running with the `FREEPDB1` pluggable database
- The schema and seed data already loaded into the `fleet_force` user

### Step 1: Start the Backend Server
```bash
cd backend
node server.js
```
You should see:
```
✅ Oracle connection pool created (thin mode)
🚀 Fleet Force server running at http://localhost:3000
📡 WebSocket at ws://localhost:3000/ws
🎮 Simulation: 19 trips, 1:20 ratio, 3s ticks
```

### Step 2: Open the Frontend
Open your browser and go to:
```
http://localhost:3000
```
The backend serves the frontend automatically — no separate frontend server needed.

### Step 3: Login
Use any of the pre-seeded accounts:
| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Super Admin |
| `fleet_mgr` | `fleet123` | Fleet Manager |
| `dispatcher1` | `dispatch123` | Dispatcher |

---

## How to Stop the Application

Press `Ctrl + C` in the terminal where `node server.js` is running. That's it — the server and simulation will shut down gracefully.

---

## What to Explain to Your Teacher

### 1. 🎯 Project Overview
> "Fleet Force is a **real-time logistics management system** that simulates a fleet of 21 trucks, 25 trailers, and 44 drivers operating across 6 major Indian cities — Mangaluru, Bengaluru, Chennai, Mumbai, Delhi, and Kolkata. It's a **single-page application** connected to an **Oracle 26ai database** with 39 normalized tables."

### 2. 🗄️ Database Design (DBMS Focus)
This is the core of the project. Highlight:
- **39 tables** designed with proper **normalization** (3NF)
- **Primary keys** with Oracle `IDENTITY` columns (auto-increment)
- **Foreign key constraints** linking drivers → hubs, trips → routes → hubs, loads → trips, invoices → customers, etc.
- **Referential integrity** — cascading relationships between entities
- **Key tables to walk through**:
  - `DRIVER` (44 rows) — personal info, license, performance metrics
  - `TRACTOR` (21 rows) — truck specs, odometer, compliance
  - `TRAILER` (25 rows) — capacity, volume, type
  - `ROUTE` + `ROUTE_WAYPOINT` — 14 active routes with GPS waypoints
  - `TRIP` — active trip state with lat/lng tracking and progress percentage
  - `LOAD` + `LOAD_TIMELINE` — shipment lifecycle with event logging
  - `INVOICE` + `PAYMENT` — billing with GST calculations
  - `WAREHOUSE` — 22 warehouses with capacity, dock count, cold storage
  - `QUERY_LOG` — automatic logging of every SQL query executed

### 3. 🔄 SQL Operations Demonstrated
- **SELECT with JOINs**: Dashboard KPIs join across 5+ tables
- **Aggregation**: `COUNT`, `SUM`, `AVG`, `GROUP BY` for reports and KPIs
- **Subqueries**: Load detail panels fetch driver pairs, timeline events
- **INSERT**: New loads, notifications, timeline events, query logs
- **UPDATE**: Trip positions, load statuses, driver statuses updated every 3 seconds
- **DELETE**: Clear notifications, exception handling
- **Transactions**: `autoCommit` and multi-statement operations
- **CLOB handling**: Query log stores full SQL text as CLOB, retrieved with `DBMS_LOB.SUBSTR`
- **Date functions**: `CURRENT_TIMESTAMP`, date comparisons for overdue invoices

### 4. ⚡ Live SQL Terminal
> "The SQL Terminal page lets you run **live SELECT queries** directly against the Oracle database and see results in a formatted table. There's also a **Live SQL Log** panel that captures every query the application runs in the background — so you can see real-time database activity."

**Demo queries to show your teacher:**
```sql
SELECT * FROM driver WHERE status = 'On Trip'
SELECT route_name, distance_km FROM route WHERE is_active = 1
SELECT * FROM load WHERE status = 'In Transit'
SELECT company_name, email FROM customer
SELECT warehouse_name, area_sqft, capacity_pct FROM warehouse
SELECT * FROM invoice WHERE status = 'Overdue'
```

### 5. 🎮 Real-Time Simulation
- **1:20 time ratio** — 1 real minute = 20 simulation minutes
- Trucks move along real Indian highway routes with GPS waypoints
- Full lifecycle: **Unassigned → Assigned → Loading → In Transit → Unloading → Delivered** → repeat
- Drivers take **food breaks** (30 min sim), **sleep breaks** (6 hr sim), and **shift changes**
- Each truck has **2 drivers** that rotate
- **Live notifications** for every event (meal breaks, arrivals, deliveries, new consignments)
- **Timeline logging** — every phase transition is recorded in `LOAD_TIMELINE` table

### 6. 📊 Application Modules (11 Pages)
Walk through each page briefly:

| # | Page | What It Shows |
|---|------|---------------|
| 1 | **Dashboard** | KPI cards, live map with 19 moving trucks, today's dispatch, alerts |
| 2 | **Loads** | All shipments with filters, detail panel with timeline & billing |
| 3 | **Dispatch Board** | 6-column Kanban board (Unassigned → Delivered) |
| 4 | **Fleet** | 21 tractors + 25 trailers with full specs and maintenance history |
| 5 | **Drivers** | 44 driver cards with photos, license info, performance metrics |
| 6 | **Routes & Tracking** | Full-screen map with live vehicle tracking, route selection |
| 7 | **Warehouses** | 22 warehouse cards with capacity bars, docks, cold storage |
| 8 | **Billing** | Invoice table with KPIs (₹75L+ billed), filters, detail panel |
| 9 | **Reports** | 4 Chart.js charts — route performance, top drivers, revenue, financial |
| 10 | **SQL Terminal** | Interactive query runner + live SQL log of background queries |
| 11 | **Settings** | User management, theme toggle, DB info, system info |

### 7. 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Database | Oracle Database 26ai (FREEPDB1) |
| Backend | Node.js + Express.js |
| DB Driver | `oracledb` (Thin mode — no Oracle Client needed) |
| Frontend | Vanilla JavaScript (Single Page Application) |
| Styling | Custom CSS with Dark/Light theme |
| Maps | Leaflet.js + OpenStreetMap |
| Charts | Chart.js (loaded dynamically) |
| Real-time | WebSocket for live SQL log broadcast |

### 8. 💡 Key Talking Points for Viva/Presentation
1. **"Why Oracle?"** — Enterprise-grade RDBMS, supports IDENTITY columns, CLOB, advanced SQL features like `FETCH FIRST N ROWS ONLY`, `NVL`, `DBMS_LOB`
2. **"How does the simulation work?"** — A tick engine runs every 3 seconds, calculates elapsed simulation time, interpolates truck GPS positions along route waypoints, and updates the `TRIP` table
3. **"How many tables?"** — 39 tables with proper normalization, foreign keys, and constraints
4. **"What SQL operations?"** — SELECT (with multi-table JOINs), INSERT, UPDATE, DELETE, aggregation, subqueries, date handling, CLOB operations
5. **"Is the data real?"** — The routes follow real Indian highways (NH48, NH44, NH2), cities are real, companies are inspired by real logistics firms
6. **"What makes it special?"** — Real-time simulation, live SQL logging, premium UI with dark/light themes, and every page queries the Oracle database live

---

## Project File Structure
```
dbms/
├── backend/
│   ├── server.js              # Express server + simulation engine
│   ├── db/
│   │   ├── connection.js      # Oracle connection pool + query logger
│   │   ├── schema.sql         # 39 CREATE TABLE statements
│   │   ├── seed_part1.sql     # Drivers, hubs, routes
│   │   ├── seed_part2.sql     # Trucks, trailers
│   │   ├── seed_part3.sql     # Customers, products, orders
│   │   ├── seed_part4.sql     # Warehouses, invoices, notifications
│   │   ├── seed_part5.sql     # Route waypoints (GPS coordinates)
│   │   └── seed_part6.sql     # Trips, loads, timeline events
│   └── package.json
├── frontend/
│   ├── index.html             # SPA shell with auth + navigation
│   ├── css/
│   │   └── index.css          # Design system (dark/light themes)
│   └── js/
│       ├── app.js             # Core router + dashboard
│       ├── loads.js           # Loads module
│       ├── dispatch.js        # Dispatch board (Kanban)
│       ├── fleet.js           # Fleet management
│       ├── drivers.js         # Driver management
│       ├── tracking.js        # Routes & tracking map
│       ├── warehouses.js      # Warehouse dashboard
│       ├── billing.js         # Billing & invoices
│       ├── reports.js         # Charts & reports
│       ├── queries.js         # SQL terminal
│       └── settings.js        # Settings page
├── drivers/                   # Driver photos (1-44.jpg)
├── trucks/                    # Truck photos
├── trailers/                  # Trailer photos
└── hello.md                   # ← You are here!
```

---

**Good luck with your presentation! 🎉**
