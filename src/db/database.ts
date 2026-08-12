/**
 * Bike Workshop Manager - SQLite Database Service (sql.js)
 * High-performance offline SQLite engine with automatic local disk persistence & backups.
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { CREATE_TABLES_SQL, INITIAL_SETTINGS, SEED_DATA_SQL } from './schema';
import type {
  Customer,
  Bike,
  SparePart,
  StockMovement,
  Supplier,
  Purchase,
  PurchaseItem,
  RepairJob,
  RepairJobItem,
  Invoice,
  InvoiceItem,
  Expense,
  ShopSettings,
  DashboardSummary,
  BackupRecord,
  SearchResult,
  StockMovementType
} from '../types';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

// File path helper for Node environment
const STORAGE_KEY = 'bike_workshop_sqlite_db';

/**
 * Initialize SQL.js engine & load or create database
 */
export async function initDatabase(customBinary?: Uint8Array): Promise<Database> {
  if (db && !customBinary) return db;

  if (!SQL) {
    try {
      SQL = await initSqlJs({
        locateFile: () => sqlWasmUrl || '/sql-wasm.wasm'
      });
    } catch (localErr) {
      console.warn('WASM init with sqlWasmUrl failed, attempting fallback...', localErr);
      SQL = await initSqlJs({
        locateFile: () => '/sql-wasm.wasm'
      });
    }
  }

  if (customBinary) {
    db = new SQL.Database(customBinary);
    saveDatabase();
    return db;
  }

  // Try loading existing stored database from localStorage or file system
  let savedData: Uint8Array | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      savedData = new Uint8Array(parsed);
    }
  } catch (err) {
    console.warn('Could not read saved database from localStorage:', err);
  }

  if (savedData) {
    try {
      db = new SQL.Database(savedData);
      ensureTablesExist();
      return db;
    } catch (e) {
      console.error('Error opening saved DB, creating fresh database', e);
    }
  }

  // Create fresh SQLite database
  db = new SQL.Database();
  ensureTablesExist();
  seedInitialData();
  saveDatabase();
  return db;
}

/**
 * Save SQLite binary data to local storage
 */
export function saveDatabase(): void {
  if (!db) return;
  try {
    const binary = db.export();
    const arr = Array.from(binary);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (err) {
    console.warn('Failed saving DB binary to localStorage:', err);
  }
}

/**
 * Get SQLite Database instance
 */
export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Ensure all tables exist
 */
function ensureTablesExist() {
  if (!db) return;
  db.run(CREATE_TABLES_SQL);
}

/**
 * Seed initial sample data if tables are empty
 */
export function seedInitialData(forceReset = false) {
  if (!db) return;

  if (forceReset) {
    // Drop existing tables
    const dropSql = `
      DROP TABLE IF EXISTS invoice_items;
      DROP TABLE IF EXISTS invoices;
      DROP TABLE IF EXISTS repair_job_items;
      DROP TABLE IF EXISTS repair_jobs;
      DROP TABLE IF EXISTS purchase_items;
      DROP TABLE IF EXISTS purchases;
      DROP TABLE IF EXISTS stock_movements;
      DROP TABLE IF EXISTS spare_parts;
      DROP TABLE IF EXISTS suppliers;
      DROP TABLE IF EXISTS bikes;
      DROP TABLE IF EXISTS customers;
      DROP TABLE IF EXISTS expenses;
      DROP TABLE IF EXISTS backups;
      DROP TABLE IF EXISTS settings;
    `;
    db.run(dropSql);
    db.run(CREATE_TABLES_SQL);
  }

  // Check if customers table is empty
  const res = db.exec('SELECT COUNT(*) as cnt FROM customers');
  const count = res[0]?.values[0][0] as number || 0;

  if (count === 0 || forceReset) {
    // Insert initial settings
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of INITIAL_SETTINGS) {
      stmt.run([k, v]);
    }
    stmt.free();

    // Insert Seed Data
    db.run(SEED_DATA_SQL);
    saveDatabase();
  }
}

// ==========================================
// SHOP SETTINGS OPERATIONS
// ==========================================

export function getSettings(): ShopSettings {
  const instance = getDb();
  const res = instance.exec('SELECT key, value FROM settings');
  const kv: Record<string, string> = {};
  if (res[0]) {
    for (const row of res[0].values) {
      kv[row[0] as string] = row[1] as string;
    }
  }

  const phone = kv['phone'] || kv['shopPhone'] || '0300-8452109 / 042-35891234';
  const address = kv['address'] || kv['shopAddress'] || 'Shop #12, Auto Market, Main Boulevard, Lahore';
  const tagline = kv['tagline'] || kv['subtitle'] || 'Workshop, Spare Parts & Billing Management System';
  const terms = kv['terms'] || kv['invoiceFooter'] || 'Thank you for choosing our workshop! Drive safe.';

  return {
    shopName: kv['shopName'] || 'Bike Workshop Manager',
    subtitle: tagline,
    tagline,
    shopAddress: address,
    address,
    shopPhone: phone,
    phone,
    currency: kv['currency'] || 'Rs.',
    invoiceFooter: terms,
    terms,
    lowStockThreshold: parseInt(kv['lowStockThreshold'] || '5', 10),
    defaultLabourCost: parseFloat(kv['defaultLabourCost'] || '500'),
    invoicePrintFormat: (kv['invoicePrintFormat'] as any) || 'thermal_80mm',
    autoBackupEnabled: kv['autoBackupEnabled'] !== 'false',
    allowNegativeStock: kv['allowNegativeStock'] === 'true'
  };
}

export function saveSettings(settings: Partial<ShopSettings>) {
  const instance = getDb();
  const stmt = instance.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(settings)) {
    stmt.run([key, String(value)]);
  }
  stmt.free();
  saveDatabase();
}

// ==========================================
// DASHBOARD SUMMARY OPERATIONS
// ==========================================

export function getDashboardSummary(): DashboardSummary {
  const instance = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Bikes received today
  let bikesReceivedToday = 0;
  let bikesInProgress = 0;
  let bikesReady = 0;
  let bikesDeliveredToday = 0;

  const jobsRes = instance.exec(`
    SELECT status, date FROM repair_jobs
  `);

  if (jobsRes[0]) {
    for (const row of jobsRes[0].values) {
      const status = row[0] as string;
      const jobDate = (row[1] as string || '').split('T')[0];

      if (jobDate === today) bikesReceivedToday++;
      if (status === 'In Progress' || status === 'Waiting for Parts' || status === 'Received' || status === 'Inspection') bikesInProgress++;
      if (status === 'Ready') bikesReady++;
      if (status === 'Delivered' && jobDate === today) bikesDeliveredToday++;
    }
  }

  // Today Sales & Labour
  let todaySales = 0;
  let todayLabourCharges = 0;
  let monthlyRevenue = 0;

  const invRes = instance.exec(`
    SELECT subtotal, labour_amount, total_amount, date FROM invoices
  `);
  if (invRes[0]) {
    for (const row of invRes[0].values) {
      const dateStr = (row[3] as string) || '';
      const total = (row[2] as number) || 0;
      const labour = (row[1] as number) || 0;

      if (dateStr.startsWith(today)) {
        todaySales += total;
        todayLabourCharges += labour;
      }
      monthlyRevenue += total;
    }
  }

  // Today Expenses & Monthly Expenses
  let todayExpenses = 0;
  let monthlyExpenses = 0;
  const expRes = instance.exec(`
    SELECT amount, date FROM expenses
  `);
  if (expRes[0]) {
    for (const row of expRes[0].values) {
      const amt = (row[0] as number) || 0;
      const dateStr = (row[1] as string) || '';

      if (dateStr.startsWith(today)) {
        todayExpenses += amt;
      }
      monthlyExpenses += amt;
    }
  }

  // Stock Counts & Valuation
  const settings = getSettings();
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalInventoryValue = 0;

  const partsRes = instance.exec(`
    SELECT current_qty, min_stock, purchase_price FROM spare_parts
  `);
  if (partsRes[0]) {
    for (const row of partsRes[0].values) {
      const qty = row[0] as number;
      const minStock = (row[1] as number) || settings.lowStockThreshold || 5;
      const pPrice = (row[2] as number) || 0;

      totalInventoryValue += Math.max(0, qty) * pPrice;

      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty <= minStock) {
        lowStockCount++;
      }
    }
  }

  // Pending Jobs Count
  let pendingJobsCount = 0;
  const pJobsRes = instance.exec(`
    SELECT COUNT(*) FROM repair_jobs WHERE status NOT IN ('Delivered', 'Cancelled')
  `);
  if (pJobsRes[0]) {
    pendingJobsCount = (pJobsRes[0].values[0][0] as number) || 0;
  }

  // Pending Payments Amount
  let pendingPaymentsAmount = 0;
  const pPayRes = instance.exec(`
    SELECT SUM(remaining_amount) FROM invoices WHERE status != 'Paid'
  `);
  if (pPayRes[0] && pPayRes[0].values[0][0]) {
    pendingPaymentsAmount = (pPayRes[0].values[0][0] as number) || 0;
  }

  // Unpaid Supplier Dues
  let unpaidSupplierDues = 0;
  const supRes = instance.exec(`
    SELECT SUM(outstanding_balance) FROM suppliers
  `);
  if (supRes[0] && supRes[0].values[0][0]) {
    unpaidSupplierDues = (supRes[0].values[0][0] as number) || 0;
  }

  return {
    todayRevenue: todaySales,
    todaySales,
    todayJobsCount: bikesReceivedToday,
    bikesReceivedToday,
    bikesInProgress,
    jobsInProgress: bikesInProgress,
    bikesReady,
    bikesDeliveredToday,
    todayLabourCharges,
    todayExpenses,
    todayNetAmount: todaySales - todayExpenses,
    lowStockCount,
    outOfStockCount,
    pendingJobsCount,
    pendingPaymentsAmount,
    unpaidSupplierDues,
    monthlyRevenue,
    monthlyExpenses,
    totalInventoryValue
  };
}

// ==========================================
// CUSTOMER OPERATIONS
// ==========================================

export function getCustomers(searchQuery = ''): Customer[] {
  const instance = getDb();
  let sql = `
    SELECT c.id, c.name, c.phone, c.address, c.notes, c.created_at,
      (SELECT COUNT(*) FROM bikes b WHERE b.customer_id = c.id) as bike_count,
      (SELECT COUNT(*) FROM repair_jobs j WHERE j.customer_id = c.id) as job_count,
      (SELECT COALESCE(SUM(i.total_amount), 0) FROM invoices i WHERE i.customer_id = c.id) as total_spent
    FROM customers c
  `;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    sql += ` WHERE LOWER(c.name) LIKE '%${q}%' OR c.phone LIKE '%${q}%'`;
  }

  sql += ' ORDER BY c.id DESC';

  const res = instance.exec(sql);
  if (!res[0]) return [];

  return res[0].values.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
    phone: row[2] as string,
    address: (row[3] as string) || '',
    notes: (row[4] as string) || '',
    createdAt: row[5] as string,
    bikeCount: row[6] as number,
    jobCount: row[7] as number,
    totalSpent: row[8] as number
  }));
}

export function addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
  const instance = getDb();
  instance.run(
    `INSERT INTO customers (name, phone, address, notes) VALUES (?, ?, ?, ?)`,
    [customer.name, customer.phone, customer.address || '', customer.notes || '']
  );
  saveDatabase();

  const res = instance.exec('SELECT last_insert_rowid()');
  const id = res[0].values[0][0] as number;
  return getCustomerById(id)!;
}

export function updateCustomer(customer: Partial<Customer> & { id: number }): Customer {
  const instance = getDb();
  instance.run(
    `UPDATE customers SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ?`,
    [customer.name || '', customer.phone || '', customer.address || '', customer.notes || '', customer.id]
  );
  saveDatabase();
  return getCustomerById(customer.id)!;
}

export function deleteCustomer(id: number): boolean {
  const instance = getDb();
  instance.run(`DELETE FROM customers WHERE id = ?`, [id]);
  saveDatabase();
  return true;
}

export function getCustomerById(id: number): Customer | null {
  const list = getCustomers();
  return list.find((c) => c.id === id) || null;
}

// ==========================================
// BIKE OPERATIONS
// ==========================================

export function getBikes(customerId?: number): Bike[] {
  const instance = getDb();
  let sql = `
    SELECT b.id, b.customer_id, b.reg_number, b.company, b.model, b.model_year,
           b.engine_num, b.chassis_num, b.mileage, b.color, b.notes, b.created_at,
           c.name as customer_name, c.phone as customer_phone
    FROM bikes b
    LEFT JOIN customers c ON b.customer_id = c.id
  `;

  if (customerId) {
    sql += ` WHERE b.customer_id = ${customerId}`;
  }

  sql += ' ORDER BY b.id DESC';

  const res = instance.exec(sql);
  if (!res[0]) return [];

  return res[0].values.map((row) => ({
    id: row[0] as number,
    customerId: row[1] as number,
    regNumber: row[2] as string,
    company: row[3] as string,
    model: row[4] as string,
    modelYear: (row[5] as string) || '',
    engineNum: (row[6] as string) || '',
    chassisNum: (row[7] as string) || '',
    mileage: (row[8] as number) || 0,
    color: (row[9] as string) || '',
    notes: (row[10] as string) || '',
    createdAt: row[11] as string,
    customerName: (row[12] as string) || 'Unknown',
    customerPhone: (row[13] as string) || ''
  }));
}

export function addBike(bike: Omit<Bike, 'id' | 'createdAt'>): Bike {
  const instance = getDb();
  instance.run(
    `INSERT INTO bikes (customer_id, reg_number, company, model, model_year, engine_num, chassis_num, mileage, color, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bike.customerId,
      bike.regNumber,
      bike.company,
      bike.model,
      bike.modelYear || '',
      bike.engineNum || '',
      bike.chassisNum || '',
      bike.mileage || 0,
      bike.color || '',
      bike.notes || ''
    ]
  );
  saveDatabase();

  const res = instance.exec('SELECT last_insert_rowid()');
  const id = res[0].values[0][0] as number;
  return getBikes().find((b) => b.id === id)!;
}

export function updateBike(bike: Partial<Bike> & { id: number }): Bike {
  const instance = getDb();
  instance.run(
    `UPDATE bikes SET reg_number = ?, company = ?, model = ?, model_year = ?, engine_num = ?, chassis_num = ?, mileage = ?, color = ?, notes = ? WHERE id = ?`,
    [
      bike.regNumber || '',
      bike.company || '',
      bike.model || '',
      bike.modelYear || '',
      bike.engineNum || '',
      bike.chassisNum || '',
      bike.mileage || 0,
      bike.color || '',
      bike.notes || '',
      bike.id
    ]
  );
  saveDatabase();
  return getBikes().find((b) => b.id === bike.id)!;
}

export function deleteBike(id: number): boolean {
  const instance = getDb();
  instance.run(`DELETE FROM bikes WHERE id = ?`, [id]);
  saveDatabase();
  return true;
}

// ==========================================
// SPARE PARTS & STOCK OPERATIONS
// ==========================================

export function getSpareParts(filter?: { category?: string; company?: string; lowStockOnly?: boolean; outOfStockOnly?: boolean; search?: string }): SparePart[] {
  const instance = getDb();
  let sql = `
    SELECT p.id, p.name, p.category, p.brand, p.part_number, p.compatible_company, p.compatible_model,
           p.purchase_price, p.selling_price, p.current_qty, p.min_stock, p.supplier_id, p.rack_location,
           p.description, p.notes, p.created_at, s.name as supplier_name
    FROM spare_parts p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE 1=1
  `;

  if (filter?.search?.trim()) {
    const q = filter.search.toLowerCase().trim();
    sql += ` AND (LOWER(p.name) LIKE '%${q}%' OR LOWER(p.part_number) LIKE '%${q}%' OR LOWER(p.brand) LIKE '%${q}%' OR LOWER(p.compatible_model) LIKE '%${q}%')`;
  }

  if (filter?.category) {
    sql += ` AND p.category = '${filter.category}'`;
  }

  if (filter?.company) {
    sql += ` AND p.compatible_company = '${filter.company}'`;
  }

  if (filter?.lowStockOnly) {
    sql += ` AND p.current_qty > 0 AND p.current_qty <= p.min_stock`;
  }

  if (filter?.outOfStockOnly) {
    sql += ` AND p.current_qty <= 0`;
  }

  sql += ' ORDER BY p.name ASC';

  const res = instance.exec(sql);
  if (!res[0]) return [];

  return res[0].values.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
    category: row[2] as string,
    brand: row[3] as string,
    partNumber: (row[4] as string) || '',
    compatibleCompany: (row[5] as string) || '',
    compatibleModel: (row[6] as string) || '',
    purchasePrice: row[7] as number,
    sellingPrice: row[8] as number,
    currentQty: row[9] as number,
    minStock: row[10] as number,
    supplierId: (row[11] as number) || undefined,
    rackLocation: (row[12] as string) || '',
    description: (row[13] as string) || '',
    notes: (row[14] as string) || '',
    createdAt: row[15] as string,
    supplierName: (row[16] as string) || ''
  }));
}

export function addSparePart(part: Omit<SparePart, 'id' | 'createdAt'>): SparePart {
  const instance = getDb();
  instance.run(
    `INSERT INTO spare_parts (name, category, brand, part_number, compatible_company, compatible_model, purchase_price, selling_price, current_qty, min_stock, supplier_id, rack_location, description, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      part.name,
      part.category,
      part.brand,
      part.partNumber || '',
      part.compatibleCompany || '',
      part.compatibleModel || '',
      part.purchasePrice,
      part.sellingPrice,
      part.currentQty || 0,
      part.minStock || 5,
      part.supplierId || null,
      part.rackLocation || '',
      part.description || '',
      part.notes || ''
    ]
  );

  const res = instance.exec('SELECT last_insert_rowid()');
  const id = res[0].values[0][0] as number;

  // Record initial stock movement if currentQty > 0
  if (part.currentQty && part.currentQty > 0) {
    recordStockMovement({
      partId: id,
      qty: part.currentQty,
      type: 'Purchase',
      reason: 'Initial part inventory setup',
      userAction: 'New Part Added'
    });
  } else {
    saveDatabase();
  }

  return getSpareParts().find((p) => p.id === id)!;
}

export function updateSparePart(part: Partial<SparePart> & { id: number }): SparePart {
  const instance = getDb();
  instance.run(
    `UPDATE spare_parts SET name = ?, category = ?, brand = ?, part_number = ?, compatible_company = ?, compatible_model = ?, purchase_price = ?, selling_price = ?, min_stock = ?, supplier_id = ?, rack_location = ?, description = ?, notes = ? WHERE id = ?`,
    [
      part.name || '',
      part.category || '',
      part.brand || '',
      part.partNumber || '',
      part.compatibleCompany || '',
      part.compatibleModel || '',
      part.purchasePrice || 0,
      part.sellingPrice || 0,
      part.minStock || 5,
      part.supplierId || null,
      part.rackLocation || '',
      part.description || '',
      part.notes || '',
      part.id
    ]
  );
  saveDatabase();
  return getSpareParts().find((p) => p.id === part.id)!;
}

export function deleteSparePart(id: number): boolean {
  const instance = getDb();
  instance.run(`DELETE FROM spare_parts WHERE id = ?`, [id]);
  saveDatabase();
  return true;
}

/**
 * Record stock change and log movement history
 */
export function recordStockMovement(movement: {
  partId: number;
  qty: number;
  type: StockMovementType;
  reason: string;
  userAction: string;
  referenceId?: string;
}) {
  const instance = getDb();
  const settings = getSettings();

  // Get current part stock
  const partRes = instance.exec(`SELECT current_qty, name FROM spare_parts WHERE id = ${movement.partId}`);
  if (!partRes[0]) throw new Error('Spare part not found');

  const currentStock = partRes[0].values[0][0] as number;
  const partName = partRes[0].values[0][1] as string;
  const newStock = currentStock + movement.qty;

  if (newStock < 0 && !settings.allowNegativeStock) {
    throw new Error(`Insufficient stock for "${partName}". Available stock: ${currentStock}, Requested change: ${movement.qty}`);
  }

  // Update part stock
  instance.run(`UPDATE spare_parts SET current_qty = ? WHERE id = ?`, [newStock, movement.partId]);

  // Insert movement log
  instance.run(
    `INSERT INTO stock_movements (part_id, qty, type, reason, user_action, reference_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [movement.partId, movement.qty, movement.type, movement.reason, movement.userAction, movement.referenceId || '']
  );

  saveDatabase();
}

export function getStockMovements(partId?: number): StockMovement[] {
  const instance = getDb();
  let sql = `
    SELECT m.id, m.part_id, m.qty, m.type, m.reason, m.user_action, m.reference_id, m.created_at, p.name as part_name
    FROM stock_movements m
    LEFT JOIN spare_parts p ON m.part_id = p.id
  `;

  if (partId) {
    sql += ` WHERE m.part_id = ${partId}`;
  }

  sql += ' ORDER BY m.id DESC LIMIT 100';

  const res = instance.exec(sql);
  if (!res[0]) return [];

  return res[0].values.map((row) => ({
    id: row[0] as number,
    partId: row[1] as number,
    qty: row[2] as number,
    type: row[3] as StockMovementType,
    reason: row[4] as string,
    userAction: row[5] as string,
    referenceId: (row[6] as string) || '',
    createdAt: row[7] as string,
    partName: (row[8] as string) || 'Unknown Part'
  }));
}

// ==========================================
// REPAIR JOB CARD OPERATIONS
// ==========================================

export function getRepairJobs(statusFilter?: string): RepairJob[] {
  const instance = getDb();
  let sql = `
    SELECT j.id, j.job_number, j.customer_id, j.bike_id, j.date, j.expected_delivery, j.current_mileage,
           j.complaint, j.initial_inspection, j.work_required, j.work_done, j.mechanic_assigned,
           j.priority, j.status, j.labour_cost, j.labour_description, j.notes, j.created_at,
           c.name as customer_name, c.phone as customer_phone,
           b.company as bike_company, b.model as bike_model, b.reg_number as bike_reg,
           i.id as invoice_id
    FROM repair_jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN bikes b ON j.bike_id = b.id
    LEFT JOIN invoices i ON j.id = i.job_id
  `;

  if (statusFilter && statusFilter !== 'All') {
    sql += ` WHERE j.status = '${statusFilter}'`;
  }

  sql += ' ORDER BY j.id DESC';

  const res = instance.exec(sql);
  if (!res[0]) return [];

  const jobs: RepairJob[] = [];

  for (const row of res[0].values) {
    const jobId = row[0] as number;

    // Fetch job items
    const itemsRes = instance.exec(`SELECT id, part_id, part_name, qty, unit_price, subtotal FROM repair_job_items WHERE job_id = ${jobId}`);
    const parts: RepairJobItem[] = itemsRes[0]
      ? itemsRes[0].values.map((iRow) => ({
          id: iRow[0] as number,
          jobId,
          partId: iRow[1] as number,
          partName: iRow[2] as string,
          qty: iRow[3] as number,
          unitPrice: iRow[4] as number,
          subtotal: iRow[5] as number
        }))
      : [];

    jobs.push({
      id: jobId,
      jobNumber: row[1] as string,
      customerId: row[2] as number,
      bikeId: row[3] as number,
      date: row[4] as string,
      expectedDelivery: (row[5] as string) || '',
      currentMileage: (row[6] as number) || 0,
      complaint: row[7] as string,
      initialInspection: (row[8] as string) || '',
      workRequired: (row[9] as string) || '',
      workDone: (row[10] as string) || '',
      mechanicAssigned: (row[11] as string) || '',
      priority: row[12] as 'Normal' | 'Urgent',
      status: row[13] as any,
      labourCost: row[14] as number,
      labourDescription: (row[15] as string) || '',
      notes: (row[16] as string) || '',
      createdAt: row[17] as string,
      customerName: (row[18] as string) || '',
      customerPhone: (row[19] as string) || '',
      bikeCompany: (row[20] as string) || '',
      bikeModel: (row[21] as string) || '',
      bikeRegNumber: (row[22] as string) || '',
      invoiceId: (row[23] as number) || undefined,
      parts
    });
  }

  return jobs;
}

export function generateJobNumber(): string {
  const instance = getDb();
  const year = new Date().getFullYear();
  const res = instance.exec(`SELECT COUNT(*) FROM repair_jobs`);
  const count = ((res[0]?.values[0][0] as number) || 0) + 1;
  return `JOB-${year}-${String(count).padStart(3, '0')}`;
}

export function createRepairJob(jobData: {
  customerId: number;
  bikeId: number;
  date: string;
  expectedDelivery?: string;
  currentMileage?: number;
  complaint: string;
  initialInspection?: string;
  workRequired?: string;
  mechanicAssigned?: string;
  priority?: 'Normal' | 'Urgent';
  labourCost?: number;
  labourDescription?: string;
  parts?: Array<{ partId: number; qty: number; unitPrice: number }>;
  notes?: string;
}): RepairJob {
  const instance = getDb();
  const jobNumber = generateJobNumber();

  instance.run(
    `INSERT INTO repair_jobs (job_number, customer_id, bike_id, date, expected_delivery, current_mileage, complaint, initial_inspection, work_required, mechanic_assigned, priority, status, labour_cost, labour_description, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      jobNumber,
      jobData.customerId,
      jobData.bikeId,
      jobData.date,
      jobData.expectedDelivery || '',
      jobData.currentMileage || 0,
      jobData.complaint,
      jobData.initialInspection || '',
      jobData.workRequired || '',
      jobData.mechanicAssigned || 'Master Mechanic',
      jobData.priority || 'Normal',
      'Received',
      jobData.labourCost || 0,
      jobData.labourDescription || '',
      jobData.notes || ''
    ]
  );

  const res = instance.exec('SELECT last_insert_rowid()');
  const jobId = res[0].values[0][0] as number;

  // Attach parts & update stock automatically!
  if (jobData.parts && jobData.parts.length > 0) {
    for (const p of jobData.parts) {
      addPartToRepairJob(jobId, p.partId, p.qty, p.unitPrice);
    }
  } else {
    saveDatabase();
  }

  return getRepairJobs().find((j) => j.id === jobId)!;
}

export function addPartToRepairJob(jobId: number, partId: number, qty: number, unitPrice: number) {
  const instance = getDb();

  // Get part name
  const partRes = instance.exec(`SELECT name FROM spare_parts WHERE id = ${partId}`);
  if (!partRes[0]) throw new Error('Spare part not found');
  const partName = partRes[0].values[0][0] as string;
  const subtotal = qty * unitPrice;

  // Insert job item
  instance.run(
    `INSERT INTO repair_job_items (job_id, part_id, part_name, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)`,
    [jobId, partId, partName, qty, unitPrice, subtotal]
  );

  // Automatically decrease inventory stock
  recordStockMovement({
    partId,
    qty: -qty,
    type: 'Repair Usage',
    reason: `Used in Repair Job #${jobId}`,
    userAction: 'Added to Job Card',
    referenceId: `JOB-${jobId}`
  });
}

export function updateRepairJobStatus(jobId: number, status: string, workDone?: string, labourCost?: number, labourDescription?: string) {
  const instance = getDb();
  let sql = `UPDATE repair_jobs SET status = ?`;
  const params: any[] = [status];

  if (workDone !== undefined) {
    sql += `, work_done = ?`;
    params.push(workDone);
  }
  if (labourCost !== undefined) {
    sql += `, labour_cost = ?`;
    params.push(labourCost);
  }
  if (labourDescription !== undefined) {
    sql += `, labour_description = ?`;
    params.push(labourDescription);
  }

  sql += ` WHERE id = ?`;
  params.push(jobId);

  instance.run(sql, params);
  saveDatabase();
}

// ==========================================
// BILLING & POS INVOICE OPERATIONS
// ==========================================

export function generateInvoiceNumber(): string {
  const instance = getDb();
  const year = new Date().getFullYear();
  const res = instance.exec(`SELECT COUNT(*) FROM invoices`);
  const count = ((res[0]?.values[0][0] as number) || 0) + 1;
  return `INV-${year}-${String(count).padStart(3, '0')}`;
}

export function getInvoices(): Invoice[] {
  const instance = getDb();
  const res = instance.exec(`
    SELECT i.id, i.invoice_number, i.job_id, i.customer_id, i.bike_id, i.date,
           i.subtotal, i.labour_amount, i.discount, i.total_amount, i.paid_amount,
           i.remaining_amount, i.payment_method, i.status, i.notes, i.created_at,
           c.name as customer_name, c.phone as customer_phone,
           b.reg_number as bike_reg, b.model as bike_model
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN bikes b ON i.bike_id = b.id
    ORDER BY i.id DESC
  `);

  if (!res[0]) return [];

  const invoices: Invoice[] = [];

  for (const row of res[0].values) {
    const invId = row[0] as number;
    const itemsRes = instance.exec(`SELECT id, part_id, item_type, description, qty, unit_price, subtotal FROM invoice_items WHERE invoice_id = ${invId}`);
    const items: InvoiceItem[] = itemsRes[0]
      ? itemsRes[0].values.map((iRow) => ({
          id: iRow[0] as number,
          invoiceId: invId,
          partId: (iRow[1] as number) || undefined,
          itemType: iRow[2] as 'Part' | 'Labour' | 'Other',
          description: iRow[3] as string,
          qty: iRow[4] as number,
          unitPrice: iRow[5] as number,
          subtotal: iRow[6] as number
        }))
      : [];

    invoices.push({
      id: invId,
      invoiceNumber: row[1] as string,
      jobId: (row[2] as number) || undefined,
      customerId: row[3] as number,
      bikeId: (row[4] as number) || undefined,
      date: row[5] as string,
      subtotal: row[6] as number,
      labourAmount: row[7] as number,
      discount: row[8] as number,
      totalAmount: row[9] as number,
      paidAmount: row[10] as number,
      remainingAmount: row[11] as number,
      paymentMethod: row[12] as any,
      status: row[13] as any,
      notes: (row[14] as string) || '',
      createdAt: row[15] as string,
      customerName: (row[16] as string) || '',
      customerPhone: (row[17] as string) || '',
      bikeRegNumber: (row[18] as string) || '',
      bikeModel: (row[19] as string) || '',
      items
    });
  }

  return invoices;
}

export function createInvoice(invData: {
  jobId?: number;
  customerId: number;
  bikeId?: number;
  date: string;
  items: Array<{ partId?: number; itemType: 'Part' | 'Labour' | 'Other'; description: string; qty: number; unitPrice: number }>;
  labourAmount?: number;
  discount?: number;
  paidAmount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Other';
  notes?: string;
  isDirectSale?: boolean;
}): Invoice {
  const instance = getDb();
  const invoiceNumber = generateInvoiceNumber();

  let subtotalParts = 0;
  for (const item of invData.items) {
    if (item.itemType === 'Part') {
      subtotalParts += item.qty * item.unitPrice;
    }
  }

  const labour = invData.labourAmount || 0;
  const grossTotal = subtotalParts + labour;
  const discount = invData.discount || 0;
  const netTotal = Math.max(0, grossTotal - discount);
  const paid = invData.paidAmount;
  const remaining = Math.max(0, netTotal - paid);

  let status: 'Paid' | 'Partial' | 'Unpaid' = 'Paid';
  if (remaining > 0 && paid > 0) status = 'Partial';
  if (paid === 0) status = 'Unpaid';

  instance.run(
    `INSERT INTO invoices (invoice_number, job_id, customer_id, bike_id, date, subtotal, labour_amount, discount, total_amount, paid_amount, remaining_amount, payment_method, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoiceNumber,
      invData.jobId || null,
      invData.customerId,
      invData.bikeId || null,
      invData.date,
      subtotalParts,
      labour,
      discount,
      netTotal,
      paid,
      remaining,
      invData.paymentMethod,
      status,
      invData.notes || ''
    ]
  );

  const res = instance.exec('SELECT last_insert_rowid()');
  const invId = res[0].values[0][0] as number;

  // Insert invoice items
  for (const item of invData.items) {
    const itemSubtotal = item.qty * item.unitPrice;
    instance.run(
      `INSERT INTO invoice_items (invoice_id, part_id, item_type, description, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invId, item.partId || null, item.itemType, item.description, item.qty, item.unitPrice, itemSubtotal]
    );

    // If direct sale without repair job, automatically reduce stock
    if (invData.isDirectSale && item.partId && item.itemType === 'Part') {
      recordStockMovement({
        partId: item.partId,
        qty: -item.qty,
        type: 'Sale',
        reason: `Direct POS OTC Sale Invoice #${invoiceNumber}`,
        userAction: 'Direct POS Sale',
        referenceId: invoiceNumber
      });
    }
  }

  // If created from repair job, set repair job status to Delivered/Ready
  if (invData.jobId) {
    updateRepairJobStatus(invData.jobId, 'Delivered');
  }

  saveDatabase();
  return getInvoices().find((i) => i.id === invId)!;
}

// ==========================================
// SUPPLIER & PURCHASE OPERATIONS
// ==========================================

export function getSuppliers(): Supplier[] {
  const instance = getDb();
  const res = instance.exec(`
    SELECT id, name, phone, company, address, outstanding_balance, notes, created_at
    FROM suppliers ORDER BY name ASC
  `);
  if (!res[0]) return [];

  return res[0].values.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
    phone: row[2] as string,
    company: (row[3] as string) || '',
    address: (row[4] as string) || '',
    outstandingBalance: row[5] as number,
    notes: (row[6] as string) || '',
    createdAt: row[7] as string
  }));
}

export function addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'outstandingBalance'>): Supplier {
  const instance = getDb();
  instance.run(
    `INSERT INTO suppliers (name, phone, company, address, notes) VALUES (?, ?, ?, ?, ?)`,
    [supplier.name, supplier.phone, supplier.company || '', supplier.address || '', supplier.notes || '']
  );
  saveDatabase();

  const res = instance.exec('SELECT last_insert_rowid()');
  const id = res[0].values[0][0] as number;
  return getSuppliers().find((s) => s.id === id)!;
}

export function getPurchases(): Purchase[] {
  const instance = getDb();
  const res = instance.exec(`
    SELECT p.id, p.purchase_number, p.supplier_id, p.date, p.total_amount, p.paid_amount, p.payment_status, p.notes, p.created_at, s.name as supplier_name
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    ORDER BY p.id DESC
  `);
  if (!res[0]) return [];

  const purchases: Purchase[] = [];

  for (const row of res[0].values) {
    const pId = row[0] as number;
    const itemsRes = instance.exec(`SELECT id, part_id, part_name, qty, unit_price, subtotal FROM purchase_items WHERE purchase_id = ${pId}`);
    const items: PurchaseItem[] = itemsRes[0]
      ? itemsRes[0].values.map((iRow) => ({
          id: iRow[0] as number,
          purchaseId: pId,
          partId: iRow[1] as number,
          partName: iRow[2] as string,
          qty: iRow[3] as number,
          unitPrice: iRow[4] as number,
          subtotal: iRow[5] as number
        }))
      : [];

    purchases.push({
      id: pId,
      purchaseNumber: row[1] as string,
      supplierId: row[2] as number,
      date: row[3] as string,
      totalAmount: row[4] as number,
      paidAmount: row[5] as number,
      paymentStatus: row[6] as 'Paid' | 'Partial' | 'Unpaid',
      notes: (row[7] as string) || '',
      createdAt: row[8] as string,
      supplierName: (row[9] as string) || '',
      items
    });
  }

  return purchases;
}

export function createPurchase(purchaseData: {
  supplierId: number;
  date: string;
  items: Array<{ partId: number; qty: number; unitPrice: number }>;
  paidAmount: number;
  notes?: string;
}): Purchase {
  const instance = getDb();
  const year = new Date().getFullYear();
  const countRes = instance.exec(`SELECT COUNT(*) FROM purchases`);
  const count = ((countRes[0]?.values[0][0] as number) || 0) + 1;
  const purchaseNumber = `PUR-${year}-${String(count).padStart(3, '0')}`;

  let totalAmount = 0;
  for (const item of purchaseData.items) {
    totalAmount += item.qty * item.unitPrice;
  }

  const unpaid = Math.max(0, totalAmount - purchaseData.paidAmount);
  let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Paid';
  if (unpaid > 0 && purchaseData.paidAmount > 0) paymentStatus = 'Partial';
  if (purchaseData.paidAmount === 0) paymentStatus = 'Unpaid';

  instance.run(
    `INSERT INTO purchases (purchase_number, supplier_id, date, total_amount, paid_amount, payment_status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [purchaseNumber, purchaseData.supplierId, purchaseData.date, totalAmount, purchaseData.paidAmount, paymentStatus, purchaseData.notes || '']
  );

  const res = instance.exec('SELECT last_insert_rowid()');
  const pId = res[0].values[0][0] as number;

  // Process items & update stock automatically!
  for (const item of purchaseData.items) {
    const partRes = instance.exec(`SELECT name FROM spare_parts WHERE id = ${item.partId}`);
    const partName = partRes[0] ? (partRes[0].values[0][0] as string) : 'Part';
    const subtotal = item.qty * item.unitPrice;

    instance.run(
      `INSERT INTO purchase_items (purchase_id, part_id, part_name, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)`,
      [pId, item.partId, partName, item.qty, item.unitPrice, subtotal]
    );

    // Increase inventory stock!
    recordStockMovement({
      partId: item.partId,
      qty: item.qty,
      type: 'Purchase',
      reason: `Stock purchase #${purchaseNumber}`,
      userAction: 'Supplier Purchase Received',
      referenceId: purchaseNumber
    });
  }

  // Update supplier outstanding balance
  if (unpaid > 0) {
    instance.run(
      `UPDATE suppliers SET outstanding_balance = outstanding_balance + ? WHERE id = ?`,
      [unpaid, purchaseData.supplierId]
    );
  }

  saveDatabase();
  return getPurchases().find((p) => p.id === pId)!;
}

// ==========================================
// EXPENSES OPERATIONS
// ==========================================

export function getExpenses(): Expense[] {
  const instance = getDb();
  const res = instance.exec(`
    SELECT id, title, category, amount, date, description, created_at
    FROM expenses ORDER BY id DESC
  `);
  if (!res[0]) return [];

  return res[0].values.map((row) => ({
    id: row[0] as number,
    title: (row[1] as string) || (row[2] as string) || 'Expense',
    category: row[2] as string,
    amount: row[3] as number,
    date: row[4] as string,
    note: (row[5] as string) || '',
    description: (row[5] as string) || '',
    createdAt: row[6] as string
  }));
}

export function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
  const instance = getDb();
  const titleVal = expense.title || expense.category;
  const descVal = expense.note || expense.description || '';

  instance.run(
    `INSERT INTO expenses (title, category, amount, date, description) VALUES (?, ?, ?, ?, ?)`,
    [titleVal, expense.category, expense.amount, expense.date, descVal]
  );
  saveDatabase();

  const res = instance.exec('SELECT last_insert_rowid()');
  const id = res[0].values[0][0] as number;
  return getExpenses().find((e) => e.id === id)!;
}

export function deleteExpense(id: number): boolean {
  const instance = getDb();
  instance.run(`DELETE FROM expenses WHERE id = ?`, [id]);
  saveDatabase();
  return true;
}

// ==========================================
// GLOBAL SEARCH
// ==========================================

export function globalSearch(query: string): SearchResult {
  if (!query || query.trim().length < 2) {
    return { customers: [], bikes: [], jobs: [], parts: [], invoices: [] };
  }

  const q = query.toLowerCase().trim();

  return {
    customers: getCustomers(q),
    bikes: getBikes().filter((b) =>
      b.regNumber.toLowerCase().includes(q) ||
      b.model.toLowerCase().includes(q) ||
      b.company.toLowerCase().includes(q)
    ),
    jobs: getRepairJobs().filter((j) =>
      j.jobNumber.toLowerCase().includes(q) ||
      (j.customerName && j.customerName.toLowerCase().includes(q)) ||
      (j.bikeRegNumber && j.bikeRegNumber.toLowerCase().includes(q))
    ),
    parts: getSpareParts({ search: q }),
    invoices: getInvoices().filter((i) =>
      i.invoiceNumber.toLowerCase().includes(q) ||
      (i.customerName && i.customerName.toLowerCase().includes(q)) ||
      (i.bikeRegNumber && i.bikeRegNumber.toLowerCase().includes(q))
    )
  };
}

// ==========================================
// BACKUP & RESTORE OPERATIONS
// ==========================================

export function exportDatabaseBinary(): Uint8Array {
  const instance = getDb();
  return instance.export();
}

export function importDatabaseBinary(binary: Uint8Array) {
  initDatabase(binary);
}

export function getBackupsList(): BackupRecord[] {
  const instance = getDb();
  const res = instance.exec(`
    SELECT id, filename, size_bytes, type, created_at FROM backups ORDER BY id DESC
  `);
  if (!res[0]) return [];

  return res[0].values.map((row) => ({
    id: row[0] as number,
    filename: row[1] as string,
    sizeBytes: row[2] as number,
    type: row[3] as 'Manual' | 'Auto',
    createdAt: row[4] as string
  }));
}

export function recordBackupLog(filename: string, sizeBytes: number, type: 'Manual' | 'Auto') {
  const instance = getDb();
  instance.run(
    `INSERT INTO backups (filename, size_bytes, type) VALUES (?, ?, ?)`,
    [filename, sizeBytes, type]
  );
  saveDatabase();
}
