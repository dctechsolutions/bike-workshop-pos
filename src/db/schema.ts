/**
 * Bike Workshop Manager - SQLite DDL Schema & Initial Seed Data
 */

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bikes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  reg_number TEXT NOT NULL,
  company TEXT NOT NULL,
  model TEXT NOT NULL,
  model_year TEXT,
  engine_num TEXT,
  chassis_num TEXT,
  mileage INTEGER DEFAULT 0,
  color TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  address TEXT,
  outstanding_balance REAL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spare_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  part_number TEXT,
  compatible_company TEXT,
  compatible_model TEXT,
  purchase_price REAL NOT NULL,
  selling_price REAL NOT NULL,
  current_qty INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  supplier_id INTEGER,
  rack_location TEXT,
  description TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  user_action TEXT NOT NULL,
  reference_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (part_id) REFERENCES spare_parts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_number TEXT NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  total_amount REAL NOT NULL,
  paid_amount REAL DEFAULT 0,
  payment_status TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL,
  part_id INTEGER NOT NULL,
  part_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (part_id) REFERENCES spare_parts(id)
);

CREATE TABLE IF NOT EXISTS repair_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_number TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  bike_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  expected_delivery TEXT,
  current_mileage INTEGER DEFAULT 0,
  complaint TEXT NOT NULL,
  initial_inspection TEXT,
  work_required TEXT,
  work_done TEXT,
  mechanic_assigned TEXT,
  priority TEXT DEFAULT 'Normal',
  status TEXT DEFAULT 'Received',
  labour_cost REAL DEFAULT 0,
  labour_description TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (bike_id) REFERENCES bikes(id)
);

CREATE TABLE IF NOT EXISTS repair_job_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  part_id INTEGER NOT NULL,
  part_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (job_id) REFERENCES repair_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (part_id) REFERENCES spare_parts(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  job_id INTEGER,
  customer_id INTEGER NOT NULL,
  bike_id INTEGER,
  date TEXT NOT NULL,
  subtotal REAL NOT NULL,
  labour_amount REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  paid_amount REAL NOT NULL,
  remaining_amount REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  status TEXT DEFAULT 'Paid',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (job_id) REFERENCES repair_jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  part_id INTEGER,
  item_type TEXT NOT NULL,
  description TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0,
  type TEXT DEFAULT 'Manual',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const INITIAL_SETTINGS = [
  ['shopName', 'Bike Workshop Manager'],
  ['subtitle', 'Workshop, Spare Parts & Billing Management System'],
  ['shopAddress', 'Shop #12, Auto Market, Main Boulevard, Lahore'],
  ['shopPhone', '0300-8452109 / 042-35891234'],
  ['currency', 'Rs.'],
  ['invoiceFooter', 'Thank you for choosing our workshop! Drive safe.'],
  ['lowStockThreshold', '5'],
  ['autoBackupEnabled', 'true'],
  ['allowNegativeStock', 'false']
];

export const SEED_DATA_SQL = `
-- Suppliers
INSERT INTO suppliers (name, phone, company, address, outstanding_balance, notes)
VALUES 
('Metro Auto Traders', '0300-4411223', 'Metro Parts Ltd', 'Brandreth Road, Lahore', 15000, 'Primary Honda & Yamaha OEM supplier'),
('Diamond Bike Spares', '0321-8899776', 'Diamond Imports', 'McLeod Road, Lahore', 0, 'Lubricants & Cables wholesaler');

-- Customers
INSERT INTO customers (name, phone, address, notes)
VALUES 
('Ali Raza', '0300-1234567', 'House 45, Model Town, Lahore', 'Regular customer, prefers genuine Honda oil'),
('Muhammad Ahmed', '0321-9876543', 'Plot 12, Johar Town, Lahore', 'Yamaha YBR rider'),
('Usman Khan', '0333-5554433', 'Street 8, Gulberg III, Lahore', 'Demands urgent servicing always');

-- Bikes
INSERT INTO bikes (customer_id, reg_number, company, model, model_year, engine_num, chassis_num, mileage, color, notes)
VALUES 
(1, 'LEC-2023-4589', 'Honda', 'CD 70', '2023', 'E-7089421', 'C-7089421', 14500, 'Red', 'Good condition'),
(1, 'LZE-2021-9921', 'Honda', 'CG 125', '2021', 'E-1254321', 'C-1254321', 28000, 'Black', 'Self-start model'),
(2, 'LHV-2022-7711', 'Yamaha', 'YBR 125', '2022', 'E-987123', 'C-987123', 19200, 'Blue', 'Needs brake check'),
(3, 'SLK-2024-1102', 'Suzuki', 'GS 150', '2024', 'E-150554', 'C-150554', 8500, 'Silver', 'Daily commuter');

-- Spare Parts
INSERT INTO spare_parts (name, category, brand, part_number, compatible_company, compatible_model, purchase_price, selling_price, current_qty, min_stock, supplier_id, rack_location, description)
VALUES 
('Spark Plug C7HSA', 'Electrical', 'NGK', 'C7HSA-70', 'Honda', 'CD 70', 180, 250, 25, 5, 1, 'A-01', 'Standard plug for 70cc bikes'),
('Brake Shoe Set (Front/Rear)', 'Brakes', 'Atlas Honda', '43125-086-000', 'Honda', 'CD 70 / CG 125', 380, 550, 18, 5, 1, 'B-02', 'High friction lining brake shoes'),
('Engine Oil 20W-50 0.7L', 'Lubricants', 'Havoline', 'HAV-07', 'Universal', '70cc / 100cc', 850, 1100, 30, 8, 2, 'C-01', 'Premium mineral engine oil'),
('Engine Oil 20W-50 1.0L', 'Lubricants', 'ZIC', 'ZIC-M7-1L', 'Universal', '125cc / 150cc', 1250, 1600, 14, 5, 2, 'C-02', '4T synthetic technology oil'),
('Chain Sprocket Kit 70cc', 'Engine & Drive', 'Crown', 'CRN-70-CK', 'Honda', 'CD 70', 1400, 1950, 8, 3, 1, 'D-01', 'Heavy duty chain and sprocket set'),
('Air Filter Element', 'Engine & Drive', 'Atlas Honda', '17211-102-000', 'Honda', 'CD 70', 120, 200, 4, 10, 1, 'A-03', 'Foam air cleaner element - Low stock demo'),
('Clutch Plate Set (5 Pcs)', 'Engine & Drive', 'FCC', 'FCC-CG125', 'Honda', 'CG 125', 1100, 1650, 2, 5, 1, 'D-03', 'Japanese tech clutch friction plates'),
('Throttle Accelerator Cable', 'Cables', 'Koyo', 'TC-CD70', 'Honda', 'CD 70', 90, 160, 15, 4, 2, 'E-01', 'Smooth inner wire cable'),
('Brake Cable Front', 'Cables', 'Koyo', 'BC-CD70', 'Honda', 'CD 70', 110, 180, 12, 4, 2, 'E-02', 'Heavy gauge brake cable'),
('Headlight Bulb 12V 35W', 'Electrical', 'Osram', 'HLB-12V35W', 'Universal', '70cc / 125cc', 140, 250, 0, 5, 1, 'A-05', 'Halogen headlight bulb - Out of stock demo'),
('Maintenance Free Battery 12V 2.5Ah', 'Electrical', 'AGS', 'AGS-12V2.5', 'Universal', 'All 12V Bikes', 2400, 3200, 6, 2, 2, 'A-06', 'Sealed lead acid battery');

-- Initial Stock Movements
INSERT INTO stock_movements (part_id, qty, type, reason, user_action)
VALUES 
(1, 30, 'Purchase', 'Initial stock intake from Metro', 'System Seed'),
(1, -5, 'Sale', 'Direct Over-the-counter sale', 'System Seed'),
(2, 20, 'Purchase', 'Initial stock intake from Metro', 'System Seed'),
(3, 35, 'Purchase', 'Initial stock intake from Diamond', 'System Seed'),
(3, -5, 'Repair Usage', 'Used in Job #JOB-2026-001', 'System Seed');

-- Completed Job 1
INSERT INTO repair_jobs (job_number, customer_id, bike_id, date, expected_delivery, current_mileage, complaint, initial_inspection, work_required, work_done, mechanic_assigned, priority, status, labour_cost, labour_description, notes)
VALUES 
('JOB-2026-001', 1, 1, '2026-08-10', '2026-08-10', 14500, 'Tuning, oil change, brake check', 'Engine sound normal, front brake slightly loose', 'Full tuning & oil change', 'Carburetor cleaned, spark plug adjusted, new engine oil added, brakes tight', 'Master Rashid', 'Normal', 'Delivered', 500, 'Tuning & General Servicing Labour', 'Customer satisfied');

INSERT INTO repair_job_items (job_id, part_id, part_name, qty, unit_price, subtotal)
VALUES 
(1, 3, 'Engine Oil 20W-50 0.7L', 1, 1100, 1100),
(1, 1, 'Spark Plug C7HSA', 1, 250, 250);

INSERT INTO invoices (invoice_number, job_id, customer_id, bike_id, date, subtotal, labour_amount, discount, total_amount, paid_amount, remaining_amount, payment_method, status)
VALUES 
('INV-2026-001', 1, 1, 1, '2026-08-10', 1350, 500, 50, 1800, 1800, 0, 'Cash', 'Paid');

INSERT INTO invoice_items (invoice_id, part_id, item_type, description, qty, unit_price, subtotal)
VALUES 
(1, 3, 'Part', 'Engine Oil 20W-50 0.7L', 1, 1100, 1100),
(1, 1, 'Part', 'Spark Plug C7HSA', 1, 250, 250),
(1, NULL, 'Labour', 'Tuning & General Servicing Labour', 1, 500, 500);

-- In-Progress Job 2
INSERT INTO repair_jobs (job_number, customer_id, bike_id, date, expected_delivery, current_mileage, complaint, initial_inspection, work_required, work_done, mechanic_assigned, priority, status, labour_cost, labour_description, notes)
VALUES 
('JOB-2026-002', 2, 3, '2026-08-11', '2026-08-11', 19200, 'Chain loose sound and clutch slipping', 'Sprocket teeth worn out', 'Chain set replacement & clutch adjustment', 'In progress: replacing chain set', 'Umer Mechanic', 'Urgent', 'In Progress', 800, 'Chain set replacement & clutch tuning', 'Urgent delivery needed by 6 PM');

INSERT INTO repair_job_items (job_id, part_id, part_name, qty, unit_price, subtotal)
VALUES 
(2, 5, 'Chain Sprocket Kit 70cc', 1, 1950, 1950);

-- Expenses
INSERT INTO expenses (title, category, amount, date, description)
VALUES 
('Workshop Shop Rent - August', 'Shop Rent', 25000, '2026-08-01', 'Monthly shop rent payment'),
('Electricity Bill - July', 'Electricity', 8400, '2026-08-05', 'LESCO electricity bill'),
('New Wrench Set & Pliers', 'Tools', 3200, '2026-08-08', 'Toolbox upgrade from Market');
`;
