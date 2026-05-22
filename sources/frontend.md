# Project Name: Fleet Force
## Frontend UI/UX Architecture & Component Specification

### 1. Core Technology Stack
* **Framework:** React.js (Vite recommended for fast compilation).
* **Styling:** Tailwind CSS (Dark Mode default).
* **Theme Colors:** * Background: `#03060d`
  * Panels/Cards: `#0a1120` to `#0f0822`
  * Borders/Separators: `#1e293b`
  * Text: `#f8fafc` (Primary), `#94a3b8` (Secondary)
  * Accent/Status: Emerald (In Transit/Good), Amber (Loading/Warning), Rose (Delayed/Critical), Blue (Assigned/Info).
* **Typography:** `Syne` for headers/logos, `IBM Plex Mono` for data tables, metrics, and code/query logs.
* **Map Integration:** Mapbox GL JS (with a custom dark theme) or Google Maps JavaScript API with dark styling.
* **Icons:** Lucide React or Heroicons.
* **Charts:** Recharts or Chart.js for the Reports module.

### 2. Global Application Layout
* **Left Navigation Sidebar:** Persistent menu containing navigation links. Active state should have a solid blue background with white text.
* **Top App Bar:** * Left: "Fleet Force" logo stylized in `Syne` font.
  * Center: Universal search bar (Search loads, trucks, drivers) and Date/Location filters.
  * Right: Notification Bell (with unread indicator) and User Profile (Mock data: K M Dushyanth Gowda - Administrator / Rohan Joshi - Dispatcher).
* **Main Content Area:** Renders the active module. Scrollable.

### 3. Screen Specifications

#### 3.1 Splash & Authentication Screen
* **Initial View:** Full-screen render of the `main.jpeg` image (the blue Fleet Force shipping container). 
* **Interaction:** Upon scrolling down, the container image fades out/scrolls up, revealing the Login/Signup portal.
* **Onboarding:** First-time signup includes standard Username/Password, plus a prompt asking for "Name" and "Role" (e.g., Administrator, Dispatcher, Driver) before redirecting to the Dashboard.

#### 3.2 Dashboard (Home)
* **Top KPI Row:** 5 metric cards (Active Loads, On-time %, Trucks Available, Exceptions, Revenue). Include small trend indicators (e.g., "↑ 12% from yesterday").
* **Main Grid Left:** "Live Operations" Map. Focused on India (Mangaluru, Bengaluru, Mumbai, Chennai, Delhi). Show color-coded truck blips representing active vehicles.
* **Main Grid Right:** "Today's Dispatch" list. Scrollable list of active loads showing Route, Driver, and Status badges.
* **Bottom Grid Left:** "Alerts & Exceptions". Highlight late pickups, HOS warnings, and unpaid invoices.
* **Bottom Grid Right:** "Quick Actions". 4 large colored buttons: Create Load (+), Assign Driver, Generate Invoice, Plan Route.

#### 3.3 Orders / Loads
* **View:** Data-dense table showing Load ID, Customer, Pickup → Drop, ETA, Status, Assigned Driver, Rate, and Margin.
* **Interaction:** Clicking a row opens a Right-Side Slide-Out Panel.
* **Slide-Out Panel Tabs:** * *Overview:* Load summary and vertical Status Timeline (Created → Assigned → Pickup → Transit → Delivery). Include mock real-time location.
  * *Stops:* Origin and destination addresses.
  * *Docs:* Downloadable/viewable placeholders for Bill of Lading, Rate Confirmation.
  * *Notes:* Internal chat/log.
  * *Billing:* Cost analysis and profit margin breakdown.

#### 3.4 Dispatch Board
* **View:** Kanban-style board with columns: Unassigned, Assigned, In-Transit, Delivered, Problem.
* **Cards:** Each card shows Load ID, Route, ETA, Rate, Driver Avatar, and Priority level. Drag-and-drop functionality (visual only for now).

#### 3.5 Fleet (Trucks & Trailers)
* **View:** Table listing Vehicle ID/Plate, Type (Tractor/Trailer), Status, Assigned Driver, Location, Last GPS Ping, Health dot.
* **Mock Data Injection (Crucial):**
  * Populate with 21 Trucks (7 Volvo FH16, 7 Scania R770, 3 Mercedes Actros 4165 SLT, 4 DAF XG+ 660). Use images from `/trucks`.
  * Populate with 25 Trailers (Flatbeds, DRY Vans, Refrigerated, Tank, Low boy, Car hauler, Double). Use images from `/trailers`.
* **Interaction:** Clicking opens a right panel showing the specific truck/trailer image, specs, and maintenance history.

#### 3.6 Drivers
* **View:** Table listing Driver profile pic, Name/ID, Status, HOS Risk (Hours of Service), Rating, Last Trip, Current Location.
* **Mock Data Injection:** Populate using the 44 images in the `/drivers` directory.
* **Interaction:** Right panel shows Driver Profile, Compliance Documents (CDL, Medical), and detailed Hours of Service countdowns.

#### 3.7 Routes & Tracking
* **View:** Full-screen interactive map (India region). 
* **Simulation Rule (1:12 Scale):** The frontend should mock a simulation where trucks move along standard highway routes between the defined hubs. 1 real-world minute = 12 simulation minutes. 
* **Mock Routes to display:**
  * Hindusthan Oil (Mumbai) ↔ Warehouse (Bengaluru) [Tank Trailer]
  * Sketchers (Mumbai) ↔ Sketchers (Chennai) [Flatbeds]
  * Havmor (Bengaluru) → Chennai (Empty return) [Refrigerated]
  * Lohan Fisheries (Chennai) → Bengaluru (Empty return) [Refrigerated]
  * Phillips (Chennai ↔ Mumbai) [Dry Van]
  * Ekart (Bengaluru ↔ Delhi) [Dry Van]
  * Shiprocket (Bengaluru ↔ Mumbai) [Dry Van]
  * Jio Oil (Kolkata) → Delhi (Empty return) [Tank Trailer]
  * Sohan Industries (Delhi ↔ Kolkata) [Flatbeds]
  * Patil Freight (Kolkata ↔ Bengaluru) [Flatbeds]
  * Delhivery (Bengaluru ↔ Mumbai) [Double Trailer]
  * Karan Pvt Ltd (Mumbai → Delhi) [Low boy - Special]
  * Neeraj Automotive (Mumbai → Bengaluru) [Car hauler - Special]

#### 3.8 Warehouses / Hubs
* **View:** Dashboard of cards representing specific facilities (Mangaluru, Bengaluru, Mumbai, Chennai, Delhi, Kolkata).
* **Card Details:** Show Capacity Utilization progress bars, Inbound/Outbound counts, and Dock Status (Available/Congested).

#### 3.9 Billing & Invoices
* **View:** Table of invoices (Invoice #, Customer, Amount, Due Date, Status). Top row contains total outstanding, paid, pending, and overdue KPIs.

#### 3.10 Reports
* **View:** Chart-heavy dashboard. 
* **Components:** Line chart for On-time Performance, Bar charts for Delays by Lane and Margin Analysis.

#### 3.11 AI Ops Assistant
* **View:** Dashboard for operational insights.
* **Sections:** Driver-Truck Suggestions (Compatibility scores), Delay Risk Alerts, Cost Leak Detection, Invoice Anomalies.

#### 3.12 Settings
* **View:** Configuration toggles for Notifications, AI & Automation Controls (Confidence Thresholds).

#### 3.13 Database Queries (Custom Module)
* **Layout:** Split-screen vertical layout.
* **Top Half (Live Log):** A read-only, auto-scrolling terminal window (black background, monospace green/white text) that simulates outputting the SQL `SELECT`, `UPDATE`, and `INSERT` statements the dashboard is currently running in the background.
* **Bottom Half (Interactive Terminal):** A command-line input style interface where a user can type a mock SQL command (e.g., `SELECT * FROM TRACTOR WHERE status = 'Maintenance';`) and press Enter to see a mock JSON or tabular response generated below it.