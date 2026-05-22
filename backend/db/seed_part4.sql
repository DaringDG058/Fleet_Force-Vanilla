-- FLEET FORCE — Seed Data Part 4: Customers, Contracts, Warehouses, Loads

-- ==================== CUSTOMERS (13 companies) ====================
INSERT INTO customer VALUES (1,'Hindusthan Oil Corporation','Rajan Mehta','rajan@hindusthanoil.in','9900010001','27AABCH1234F1ZQ','Active','Regular',SYSTIMESTAMP);
INSERT INTO customer VALUES (2,'Sketchers India Pvt Ltd','Ananya Kapoor','ananya@sketchers.in','9900010002','29BBCKS5678G2ZR','Active','Regular',SYSTIMESTAMP);
INSERT INTO customer VALUES (3,'Havmor Ice Cream Ltd','Deepesh Shah','deepesh@havmor.in','9900010003','29CCHVM9012H3ZS','Active','Regular',SYSTIMESTAMP);
INSERT INTO customer VALUES (4,'Lohan Fisheries Industry','Thomas Joseph','thomas@lohanfish.in','9900010004','33DDLFH3456I4ZT','Active','Regular',SYSTIMESTAMP);
INSERT INTO customer VALUES (5,'Phillips India Electronics','Sanjay Kapoor','sanjay@phillips.in','9900010005','33EEPHL7890J5ZU','Active','Regular',SYSTIMESTAMP);
INSERT INTO customer VALUES (6,'Ekart Logistics','Pradeep Kumar','pradeep@ekart.in','9900010006','29FFEKR1234K6ZV','Active','Regular',SYSTIMESTAMP);
INSERT INTO customer VALUES (7,'Shiprocket Express','Vishesh Khurana','vishesh@shiprocket.in','9900010007','29GGSHR5678L7ZW','Active','Regular',SYSTIMESTAMP);
INSERT INTO customer VALUES (8,'Jio Oil Refineries','Mukesh Agarwal','mukesh@jiooil.in','9900010008','19HHJIO9012M8ZX','Active','Regular',SYSTIMESTAMP);
INSERT INTO customer VALUES (9,'Sohan Industries','Sohan Lal Gupta','sohan@sohanindustries.in','9900010009','07IISOH3456N9ZY','Active','Regular',SYSTIMESTAMP);
INSERT INTO customer VALUES (10,'Patil Freight Solutions','Arun Patil','arun@patilfreight.in','9900010010','19JJPAT7890O0ZZ','Active','Regular',SYSTIMESTAMP);
INSERT INTO customer VALUES (11,'Delhivery Ltd','Sahil Barua','sahil@delhivery.in','9900010011','29KKDEL1234P1AA','Active','Premium',SYSTIMESTAMP);
INSERT INTO customer VALUES (12,'Karan Pvt Ltd','Karan Malhotra','karan@karanpvt.in','9900010012','07LLKAR5678Q2BB','Active','Special',SYSTIMESTAMP);
INSERT INTO customer VALUES (13,'Neeraj Automotive','Neeraj Bhatia','neeraj@neerajauto.in','9900010013','29MMNEE9012R3CC','Active','Special',SYSTIMESTAMP);

-- ==================== ADDRESSES ====================
INSERT INTO address VALUES (1,1,'Factory','Plot 42, MIDC Industrial Area','Mangaluru','Karnataka','575001',1);
INSERT INTO address VALUES (2,1,'Warehouse','Peenya 2nd Stage, Industrial Area','Bengaluru','Karnataka','560058',0);
INSERT INTO address VALUES (3,2,'Warehouse 1','Baikampady Industrial Area','Mangaluru','Karnataka','575011',1);
INSERT INTO address VALUES (4,2,'Warehouse 2','Guindy Industrial Estate','Chennai','Tamil Nadu','600032',0);
INSERT INTO address VALUES (5,3,'Factory','Peenya Industrial Area, Phase 3','Bengaluru','Karnataka','560058',1);
INSERT INTO address VALUES (6,3,'Warehouse','Ambattur Industrial Estate','Chennai','Tamil Nadu','600058',0);
INSERT INTO address VALUES (7,4,'Industry','Old Mahabalipuram Road','Chennai','Tamil Nadu','600096',1);
INSERT INTO address VALUES (8,4,'Warehouse','Electronic City, Phase 1','Bengaluru','Karnataka','560100',0);
INSERT INTO address VALUES (9,5,'Warehouse 1','Sriperumbudur SEZ','Chennai','Tamil Nadu','602105',1);
INSERT INTO address VALUES (10,5,'Warehouse 2','Bhiwandi Logistics Park','Mumbai','Maharashtra','421302',0);
INSERT INTO address VALUES (11,6,'Warehouse 1','Whitefield Industrial Area','Bengaluru','Karnataka','560066',1);
INSERT INTO address VALUES (12,6,'Warehouse 2','Okhla Industrial Area, Phase 3','Delhi','Delhi NCR','110020',0);
INSERT INTO address VALUES (13,7,'Warehouse 1','Bommasandra Industrial Area','Bengaluru','Karnataka','560099',1);
INSERT INTO address VALUES (14,7,'Warehouse 2','Taloja MIDC Industrial Area','Mumbai','Maharashtra','410208',0);
INSERT INTO address VALUES (15,8,'Factory','Haldia Refinery Complex','Kolkata','West Bengal','721602',1);
INSERT INTO address VALUES (16,8,'Warehouse','Kundli Industrial Area','Delhi','Delhi NCR','131028',0);
INSERT INTO address VALUES (17,9,'Factory','Mayapuri Industrial Area, Phase 2','Delhi','Delhi NCR','110064',1);
INSERT INTO address VALUES (18,9,'Warehouse','Ultadanga Industrial Estate','Kolkata','West Bengal','700067',0);
INSERT INTO address VALUES (19,10,'Factory','Liluah Industrial Park','Kolkata','West Bengal','711204',1);
INSERT INTO address VALUES (20,10,'Warehouse','Rajajinagar Industrial Area','Bengaluru','Karnataka','560010',0);
INSERT INTO address VALUES (21,11,'Warehouse 1','Sarjapur Road, Logistics Park','Bengaluru','Karnataka','560035',1);
INSERT INTO address VALUES (22,11,'Warehouse 2','Panvel Logistics Hub','Mumbai','Maharashtra','410206',0);
INSERT INTO address VALUES (23,12,'Office','Connaught Place, Block A','Delhi','Delhi NCR','110001',1);
INSERT INTO address VALUES (24,13,'Office','Andheri East, MIDC','Mumbai','Maharashtra','400093',1);

-- ==================== CONTRACTS ====================
INSERT INTO contract VALUES (1,1,'Hindusthan Oil - Regular Tanker','2025-01-01','2026-12-31','Gold',45.50,285000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (2,2,'Sketchers - Flatbed Transport','2025-02-01','2026-12-31','Silver',38.75,342000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (3,3,'Havmor - Refrigerated','2025-03-01','2026-12-31','Gold',52.00,198000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (4,4,'Lohan Fisheries - Reefer','2025-01-15','2026-12-31','Gold',55.00,210000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (5,5,'Phillips - DRY Van','2025-02-15','2026-12-31','Silver',42.00,456000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (6,6,'Ekart - DRY Van Long Haul','2025-01-01','2026-12-31','Platinum',48.50,520000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (7,7,'Shiprocket - DRY Van','2025-03-15','2026-12-31','Silver',41.00,380000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (8,8,'Jio Oil - Tanker Transport','2025-02-01','2026-12-31','Gold',47.00,312000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (9,9,'Sohan Industries - Flatbed','2025-01-15','2026-12-31','Silver',39.50,298000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (10,10,'Patil Freight - Flatbed','2025-04-01','2026-12-31','Silver',40.00,356000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (11,11,'Delhivery - Double Trailer','2025-01-01','2026-12-31','Platinum',55.00,425000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (12,12,'Karan Pvt Ltd - Special Low Boy','2026-04-01','2026-06-30','Standard',85.00,180000,'Active',SYSTIMESTAMP);
INSERT INTO contract VALUES (13,13,'Neeraj Auto - Car Hauler','2026-04-15','2026-06-30','Standard',72.00,145000,'Active',SYSTIMESTAMP);

-- ==================== CATEGORIES ====================
INSERT INTO category VALUES (1,'Petroleum Products',1,'Crude oil, refined fuel, lubricants');
INSERT INTO category VALUES (2,'Footwear & Apparel',0,'Shoes, clothing, accessories');
INSERT INTO category VALUES (3,'Frozen & Refrigerated',0,'Ice cream, dairy, frozen food');
INSERT INTO category VALUES (4,'Seafood',0,'Fresh and frozen fish, shellfish');
INSERT INTO category VALUES (5,'Electronics',0,'Consumer electronics, components');
INSERT INTO category VALUES (6,'E-Commerce Parcels',0,'Mixed parcels, packages');
INSERT INTO category VALUES (7,'Industrial Goods',0,'Raw materials, machinery parts');
INSERT INTO category VALUES (8,'Automobiles',0,'Cars, vehicles, auto parts');
INSERT INTO category VALUES (9,'General Freight',0,'Mixed cargo, palletized goods');
INSERT INTO category VALUES (10,'Heavy Machinery',0,'Construction equipment, cranes');

-- ==================== WAREHOUSES ====================
INSERT INTO warehouse VALUES (1,'Hindusthan Oil Mangaluru Factory','Factory',1,'Plot 42, MIDC, Mangaluru',45000,0,72.5,50000,36250,6,4,'Active','Rajan Mehta','9900010001',45,38);
INSERT INTO warehouse VALUES (2,'Hindusthan Oil Bengaluru Depot','Warehouse',2,'Peenya 2nd Stage, Bengaluru',35000,0,65.3,40000,26120,4,3,'Active','Arvind Kumar','9900020001',32,28);
INSERT INTO warehouse VALUES (3,'Sketchers Mangaluru Hub','Warehouse',1,'Baikampady Industrial Area',28000,0,58.7,30000,17610,4,3,'Active','Pooja Singh','9900020002',25,22);
INSERT INTO warehouse VALUES (4,'Sketchers Chennai Hub','Warehouse',4,'Guindy Industrial Estate',32000,0,61.4,35000,21490,5,4,'Active','Ramya Krishnan','9900020003',28,24);
INSERT INTO warehouse VALUES (5,'Havmor Bengaluru Factory','Factory',2,'Peenya Phase 3, Bengaluru',22000,1,78.2,25000,19550,3,2,'Active','Deepesh Shah','9900020004',18,15);
INSERT INTO warehouse VALUES (6,'Havmor Chennai Warehouse','Warehouse',4,'Ambattur Industrial Estate',18000,1,55.0,20000,11000,3,2,'Active','Lakshmi Devi','9900020005',12,10);
INSERT INTO warehouse VALUES (7,'Lohan Fisheries Chennai','Factory',4,'Old Mahabalipuram Road',20000,1,82.1,22000,18062,3,2,'Active','Thomas Joseph','9900020006',20,16);
INSERT INTO warehouse VALUES (8,'Lohan Fisheries Bengaluru Depot','Warehouse',2,'Electronic City Phase 1',15000,1,48.3,18000,8694,3,2,'Active','Sunil Kumar','9900020007',14,12);
INSERT INTO warehouse VALUES (9,'Phillips Chennai Warehouse','Warehouse',4,'Sriperumbudur SEZ',40000,0,69.8,45000,31410,6,5,'Active','Sanjay Kapoor','9900020008',38,35);
INSERT INTO warehouse VALUES (10,'Phillips Mumbai Warehouse','Warehouse',3,'Bhiwandi Logistics Park',42000,0,73.5,48000,35280,6,4,'Active','Neha Sharma','9900020009',42,38);
INSERT INTO warehouse VALUES (11,'Ekart Bengaluru Hub','Warehouse',2,'Whitefield Industrial Area',55000,0,85.6,60000,51360,8,5,'Active','Pradeep Kumar','9900020010',65,58);
INSERT INTO warehouse VALUES (12,'Ekart Delhi Hub','Warehouse',5,'Okhla Industrial Phase 3',52000,0,79.2,58000,45936,8,6,'Active','Amit Tyagi','9900020011',58,52);
INSERT INTO warehouse VALUES (13,'Shiprocket Bengaluru Centre','Warehouse',2,'Bommasandra Industrial Area',38000,0,67.4,42000,28308,5,4,'Active','Vishesh Khurana','9900020012',35,30);
INSERT INTO warehouse VALUES (14,'Shiprocket Mumbai Centre','Warehouse',3,'Taloja MIDC',36000,0,71.2,40000,28480,5,3,'Active','Rahul Desai','9900020013',32,28);
INSERT INTO warehouse VALUES (15,'Jio Oil Kolkata Refinery','Factory',6,'Haldia Refinery Complex',60000,0,76.8,70000,53760,8,5,'Active','Mukesh Agarwal','9900020014',48,42);
INSERT INTO warehouse VALUES (16,'Jio Oil Delhi Depot','Warehouse',5,'Kundli Industrial Area',45000,0,62.5,50000,31250,6,4,'Active','Suresh Yadav','9900020015',35,30);
INSERT INTO warehouse VALUES (17,'Sohan Industries Delhi Factory','Factory',5,'Mayapuri Phase 2',35000,0,70.3,38000,26714,5,4,'Active','Sohan Lal Gupta','9900020016',30,26);
INSERT INTO warehouse VALUES (18,'Sohan Industries Kolkata Depot','Warehouse',6,'Ultadanga Industrial Estate',30000,0,56.7,32000,18144,4,3,'Active','Biswas Roy','9900020017',22,18);
INSERT INTO warehouse VALUES (19,'Patil Freight Kolkata Factory','Factory',6,'Liluah Industrial Park',28000,0,64.2,30000,19260,4,3,'Active','Arun Patil','9900020018',24,20);
INSERT INTO warehouse VALUES (20,'Patil Freight Bengaluru Depot','Warehouse',2,'Rajajinagar Industrial Area',25000,0,59.8,28000,16744,4,3,'Active','Venkat Rao','9900020019',20,16);
INSERT INTO warehouse VALUES (21,'Delhivery Bengaluru Mega Hub','Warehouse',2,'Sarjapur Road',65000,0,88.2,75000,66150,10,6,'Active','Sahil Barua','9900020020',75,68);
INSERT INTO warehouse VALUES (22,'Delhivery Mumbai Mega Hub','Warehouse',3,'Panvel Logistics Hub',62000,0,82.5,70000,57750,10,7,'Active','Kapil Bharati','9900020021',70,62);

COMMIT;
