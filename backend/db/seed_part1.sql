-- ============================================================
-- FLEET FORCE — Seed Data (Part 1: Core Reference Data)
-- Realistic Indian logistics data
-- ============================================================

-- ==================== DEPARTMENTS ====================
INSERT INTO department (dept_id, dept_name, budget) VALUES (1, 'Operations', 5000000.00);
INSERT INTO department (dept_id, dept_name, budget) VALUES (2, 'Fleet Management', 3500000.00);
INSERT INTO department (dept_id, dept_name, budget) VALUES (3, 'Warehouse & Logistics', 2800000.00);
INSERT INTO department (dept_id, dept_name, budget) VALUES (4, 'Finance & Billing', 1500000.00);
INSERT INTO department (dept_id, dept_name, budget) VALUES (5, 'Human Resources', 1200000.00);
INSERT INTO department (dept_id, dept_name, budget) VALUES (6, 'Administration', 2000000.00);

-- ==================== ROLES (5 profiles) ====================
INSERT INTO roles (role_id, role_name, access_level) VALUES (1, 'Super Admin', 5);
INSERT INTO roles (role_id, role_name, access_level) VALUES (2, 'Fleet Manager', 4);
INSERT INTO roles (role_id, role_name, access_level) VALUES (3, 'Warehouse Manager', 3);
INSERT INTO roles (role_id, role_name, access_level) VALUES (4, 'Dispatcher', 2);
INSERT INTO roles (role_id, role_name, access_level) VALUES (5, 'Driver', 1);

-- ==================== EMPLOYEES (non-driver staff) ====================
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active)
VALUES (1, 'EMP-001', 'K M Dushyanth', 'Gowda', 'dushyanth@fleetforce.in', '9876543210', 6, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active)
VALUES (2, 'EMP-002', 'Rohan', 'Joshi', 'rohan.joshi@fleetforce.in', '9876543211', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active)
VALUES (3, 'EMP-003', 'Priya', 'Sharma', 'priya.sharma@fleetforce.in', '9876543212', 2, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active)
VALUES (4, 'EMP-004', 'Anil', 'Reddy', 'anil.reddy@fleetforce.in', '9876543213', 3, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active)
VALUES (5, 'EMP-005', 'Meera', 'Nair', 'meera.nair@fleetforce.in', '9876543214', 4, 1);

-- Driver employees (EMP-006 to EMP-049 for 44 drivers)
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (6, 'EMP-006', 'Rajesh', 'Kumar', 'rajesh.kumar@fleetforce.in', '9845012301', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (7, 'EMP-007', 'Suresh', 'Patil', 'suresh.patil@fleetforce.in', '9845012302', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (8, 'EMP-008', 'Manoj', 'Singh', 'manoj.singh@fleetforce.in', '9845012303', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (9, 'EMP-009', 'Vikram', 'Yadav', 'vikram.yadav@fleetforce.in', '9845012304', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (10, 'EMP-010', 'Arjun', 'Desai', 'arjun.desai@fleetforce.in', '9845012305', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (11, 'EMP-011', 'Deepak', 'Hegde', 'deepak.hegde@fleetforce.in', '9845012306', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (12, 'EMP-012', 'Ganesh', 'Shetty', 'ganesh.shetty@fleetforce.in', '9845012307', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (13, 'EMP-013', 'Harish', 'Rao', 'harish.rao@fleetforce.in', '9845012308', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (14, 'EMP-014', 'Kiran', 'Bhat', 'kiran.bhat@fleetforce.in', '9845012309', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (15, 'EMP-015', 'Mohan', 'Das', 'mohan.das@fleetforce.in', '9845012310', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (16, 'EMP-016', 'Naveen', 'Gowda', 'naveen.gowda@fleetforce.in', '9845012311', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (17, 'EMP-017', 'Prasad', 'Kulkarni', 'prasad.kulkarni@fleetforce.in', '9845012312', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (18, 'EMP-018', 'Ramesh', 'Naik', 'ramesh.naik@fleetforce.in', '9845012313', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (19, 'EMP-019', 'Santosh', 'Jain', 'santosh.jain@fleetforce.in', '9845012314', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (20, 'EMP-020', 'Venkatesh', 'Murthy', 'venkatesh.murthy@fleetforce.in', '9845012315', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (21, 'EMP-021', 'Amar', 'Patel', 'amar.patel@fleetforce.in', '9845012316', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (22, 'EMP-022', 'Bharat', 'Verma', 'bharat.verma@fleetforce.in', '9845012317', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (23, 'EMP-023', 'Chandan', 'Mishra', 'chandan.mishra@fleetforce.in', '9845012318', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (24, 'EMP-024', 'Dinesh', 'Gupta', 'dinesh.gupta@fleetforce.in', '9845012319', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (25, 'EMP-025', 'Girish', 'Menon', 'girish.menon@fleetforce.in', '9845012320', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (26, 'EMP-026', 'Hemant', 'Sawant', 'hemant.sawant@fleetforce.in', '9845012321', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (27, 'EMP-027', 'Jagdish', 'Thakur', 'jagdish.thakur@fleetforce.in', '9845012322', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (28, 'EMP-028', 'Kamal', 'Nayak', 'kamal.nayak@fleetforce.in', '9845012323', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (29, 'EMP-029', 'Lakshman', 'Iyer', 'lakshman.iyer@fleetforce.in', '9845012324', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (30, 'EMP-030', 'Nikhil', 'Choudhary', 'nikhil.choud@fleetforce.in', '9845012325', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (31, 'EMP-031', 'Omkar', 'Deshpande', 'omkar.deshpande@fleetforce.in', '9845012326', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (32, 'EMP-032', 'Pavan', 'Shenoy', 'pavan.shenoy@fleetforce.in', '9845012327', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (33, 'EMP-033', 'Ravi', 'Shankar', 'ravi.shankar@fleetforce.in', '9845012328', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (34, 'EMP-034', 'Srinivas', 'Acharya', 'srinivas.acharya@fleetforce.in', '9845012329', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (35, 'EMP-035', 'Tarun', 'Bhandari', 'tarun.bhandari@fleetforce.in', '9845012330', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (36, 'EMP-036', 'Umesh', 'Pai', 'umesh.pai@fleetforce.in', '9845012331', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (37, 'EMP-037', 'Vivek', 'Kamath', 'vivek.kamath@fleetforce.in', '9845012332', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (38, 'EMP-038', 'Yogesh', 'Pillai', 'yogesh.pillai@fleetforce.in', '9845012333', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (39, 'EMP-039', 'Ashwin', 'Tiwari', 'ashwin.tiwari@fleetforce.in', '9845012334', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (40, 'EMP-040', 'Balaji', 'Ranganathan', 'balaji.ranga@fleetforce.in', '9845012335', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (41, 'EMP-041', 'Chirag', 'Mehta', 'chirag.mehta@fleetforce.in', '9845012336', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (42, 'EMP-042', 'Darshan', 'Poojary', 'darshan.poojary@fleetforce.in', '9845012337', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (43, 'EMP-043', 'Eshwar', 'Shetty', 'eshwar.shetty@fleetforce.in', '9845012338', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (44, 'EMP-044', 'Farhan', 'Sheikh', 'farhan.sheikh@fleetforce.in', '9845012339', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (45, 'EMP-045', 'Gopal', 'Krishnan', 'gopal.krishnan@fleetforce.in', '9845012340', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (46, 'EMP-046', 'Hari', 'Prasad', 'hari.prasad@fleetforce.in', '9845012341', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (47, 'EMP-047', 'Ishaan', 'Rawat', 'ishaan.rawat@fleetforce.in', '9845012342', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (48, 'EMP-048', 'Jayant', 'Hegde', 'jayant.hegde@fleetforce.in', '9845012343', 1, 1);
INSERT INTO employee (emp_id, emp_code, first_name, last_name, email, phone, dept_id, is_active) VALUES (49, 'EMP-049', 'Krishna', 'Mallya', 'krishna.mallya@fleetforce.in', '9845012344', 1, 1);

-- ==================== APP USERS ====================
INSERT INTO app_user (user_id, username, password_hash, display_name, emp_id, role_id) VALUES (1, 'dushyanth', 'admin123', 'K M Dushyanth Gowda', 1, 1);
INSERT INTO app_user (user_id, username, password_hash, display_name, emp_id, role_id) VALUES (2, 'rohan', 'fleet123', 'Rohan Joshi', 2, 2);
INSERT INTO app_user (user_id, username, password_hash, display_name, emp_id, role_id) VALUES (3, 'priya', 'fleet123', 'Priya Sharma', 3, 2);
INSERT INTO app_user (user_id, username, password_hash, display_name, emp_id, role_id) VALUES (4, 'anil', 'warehouse123', 'Anil Reddy', 4, 3);
INSERT INTO app_user (user_id, username, password_hash, display_name, emp_id, role_id) VALUES (5, 'meera', 'dispatch123', 'Meera Nair', 5, 4);

-- ==================== HUBS (6 cities) ====================
INSERT INTO hub (hub_id, hub_name, city, state, address, latitude, longitude) VALUES (1, 'Mangaluru Logistics Hub', 'Mangaluru', 'Karnataka', 'Baikampady Industrial Area, NH-66, Mangaluru 575011', 12.9141, 74.8560);
INSERT INTO hub (hub_id, hub_name, city, state, address, latitude, longitude) VALUES (2, 'Bengaluru Central Hub', 'Bengaluru', 'Karnataka', 'Peenya Industrial Area, 4th Phase, Bengaluru 560058', 12.9716, 77.5946);
INSERT INTO hub (hub_id, hub_name, city, state, address, latitude, longitude) VALUES (3, 'Mumbai Freight Terminal', 'Mumbai', 'Maharashtra', 'JNPT Road, Nhava Sheva, Navi Mumbai 400707', 19.0760, 72.8777);
INSERT INTO hub (hub_id, hub_name, city, state, address, latitude, longitude) VALUES (4, 'Chennai Distribution Centre', 'Chennai', 'Tamil Nadu', 'Ambattur Industrial Estate, Chennai 600058', 13.0827, 80.2707);
INSERT INTO hub (hub_id, hub_name, city, state, address, latitude, longitude) VALUES (5, 'Delhi NCR Logistics Park', 'Delhi', 'Delhi NCR', 'KMP Expressway, Kundli, Sonipat 131028', 28.7041, 77.1025);
INSERT INTO hub (hub_id, hub_name, city, state, address, latitude, longitude) VALUES (6, 'Kolkata Cargo Hub', 'Kolkata', 'West Bengal', 'Dankuni Industrial Complex, NH-2, Hooghly 712310', 22.5726, 88.3639);

-- ==================== ROUTES ====================
-- Mangaluru(1) <-> Bengaluru(2) ~350km
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (1, 'Mangaluru → Bengaluru', 1, 2, 350, 7.0);
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (2, 'Bengaluru → Mangaluru', 2, 1, 350, 7.0);
-- Mangaluru(1) <-> Chennai(4) ~620km
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (3, 'Mangaluru → Chennai', 1, 4, 620, 12.5);
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (4, 'Chennai → Mangaluru', 4, 1, 620, 12.5);
-- Bengaluru(2) <-> Chennai(4) ~350km
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (5, 'Bengaluru → Chennai', 2, 4, 350, 6.5);
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (6, 'Chennai → Bengaluru', 4, 2, 350, 6.5);
-- Chennai(4) <-> Mumbai(3) ~1340km
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (7, 'Chennai → Mumbai', 4, 3, 1340, 22.0);
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (8, 'Mumbai → Chennai', 3, 4, 1340, 22.0);
-- Bengaluru(2) <-> Delhi(5) ~2150km
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (9, 'Bengaluru → Delhi', 2, 5, 2150, 36.0);
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (10, 'Delhi → Bengaluru', 5, 2, 2150, 36.0);
-- Bengaluru(2) <-> Mumbai(3) ~980km
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (11, 'Bengaluru → Mumbai', 2, 3, 980, 16.0);
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (12, 'Mumbai → Bengaluru', 3, 2, 980, 16.0);
-- Kolkata(6) <-> Delhi(5) ~1470km
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (13, 'Kolkata → Delhi', 6, 5, 1470, 24.0);
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (14, 'Delhi → Kolkata', 5, 6, 1470, 24.0);
-- Delhi(5) <-> Kolkata(6) same but needed for Sohan
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (15, 'Kolkata → Bengaluru', 6, 2, 1870, 31.0);
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (16, 'Bengaluru → Kolkata', 2, 6, 1870, 31.0);
-- Mumbai(3) <-> Delhi(5) ~1420km
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (17, 'Mumbai → Delhi', 3, 5, 1420, 24.0);
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (18, 'Delhi → Mumbai', 5, 3, 1420, 24.0);
-- Mumbai(3) <-> Bengaluru(2) for Car Hauler
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (19, 'Mumbai → Mangaluru', 3, 1, 580, 10.0);
INSERT INTO route (route_id, route_name, origin_hub_id, dest_hub_id, distance_km, est_hours) VALUES (20, 'Mangaluru → Mumbai', 1, 3, 580, 10.0);

COMMIT;
