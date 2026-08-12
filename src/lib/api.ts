/**
 * Bike Workshop Manager - Data Access Layer (Local Database Bridge)
 */

import * as dbService from '../db/database';
import type {
  Customer,
  Bike,
  SparePart,
  StockMovement,
  Supplier,
  Purchase,
  RepairJob,
  Invoice,
  Expense,
  ShopSettings,
  DashboardSummary,
  BackupRecord,
  SearchResult
} from '../types';

export const api = {
  // Initialization
  async initDb(binaryData?: Uint8Array) {
    return await dbService.initDatabase(binaryData);
  },

  // Settings
  getSettings(): ShopSettings {
    return dbService.getSettings();
  },

  saveSettings(settings: Partial<ShopSettings>) {
    return dbService.saveSettings(settings);
  },

  seedDemoData(forceReset = true) {
    dbService.seedInitialData(forceReset);
  },

  // Dashboard Summary
  getDashboardSummary(): DashboardSummary {
    return dbService.getDashboardSummary();
  },

  // Customers
  getCustomers(search = ''): Customer[] {
    return dbService.getCustomers(search);
  },

  getCustomerById(id: number): Customer | null {
    return dbService.getCustomerById(id);
  },

  addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
    return dbService.addCustomer(customer);
  },

  updateCustomer(customer: Partial<Customer> & { id: number }): Customer {
    return dbService.updateCustomer(customer);
  },

  deleteCustomer(id: number): boolean {
    return dbService.deleteCustomer(id);
  },

  // Bikes
  getBikes(customerId?: number): Bike[] {
    return dbService.getBikes(customerId);
  },

  addBike(bike: Omit<Bike, 'id' | 'createdAt'>): Bike {
    return dbService.addBike(bike);
  },

  updateBike(bike: Partial<Bike> & { id: number }): Bike {
    return dbService.updateBike(bike);
  },

  deleteBike(id: number): boolean {
    return dbService.deleteBike(id);
  },

  // Spare Parts
  getSpareParts(filter?: { category?: string; company?: string; lowStockOnly?: boolean; outOfStockOnly?: boolean; search?: string }): SparePart[] {
    return dbService.getSpareParts(filter);
  },

  addSparePart(part: Omit<SparePart, 'id' | 'createdAt'>): SparePart {
    return dbService.addSparePart(part);
  },

  updateSparePart(part: Partial<SparePart> & { id: number }): SparePart {
    return dbService.updateSparePart(part);
  },

  deleteSparePart(id: number): boolean {
    return dbService.deleteSparePart(id);
  },

  adjustStock(partId: number, qtyChange: number, reason: string, userAction = 'Manual Adjustment') {
    dbService.recordStockMovement({
      partId,
      qty: qtyChange,
      type: 'Manual Adjustment',
      reason,
      userAction
    });
  },

  getStockMovements(partId?: number): StockMovement[] {
    return dbService.getStockMovements(partId);
  },

  // Repair Jobs
  getRepairJobs(statusFilter?: string): RepairJob[] {
    return dbService.getRepairJobs(statusFilter);
  },

  createRepairJob(jobData: Parameters<typeof dbService.createRepairJob>[0]): RepairJob {
    return dbService.createRepairJob(jobData);
  },

  addPartToRepairJob(jobId: number, partId: number, qty: number, unitPrice: number) {
    dbService.addPartToRepairJob(jobId, partId, qty, unitPrice);
  },

  updateRepairJobStatus(jobId: number, status: string, workDone?: string, labourCost?: number, labourDescription?: string) {
    dbService.updateRepairJobStatus(jobId, status, workDone, labourCost, labourDescription);
  },

  // Billing & Invoices
  getInvoices(): Invoice[] {
    return dbService.getInvoices();
  },

  createInvoice(invData: Parameters<typeof dbService.createInvoice>[0]): Invoice {
    return dbService.createInvoice(invData);
  },

  // Suppliers & Purchases
  getSuppliers(): Supplier[] {
    return dbService.getSuppliers();
  },

  addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'outstandingBalance'>): Supplier {
    return dbService.addSupplier(supplier);
  },

  getPurchases(): Purchase[] {
    return dbService.getPurchases();
  },

  createPurchase(purchaseData: Parameters<typeof dbService.createPurchase>[0]): Purchase {
    return dbService.createPurchase(purchaseData);
  },

  // Expenses
  getExpenses(): Expense[] {
    return dbService.getExpenses();
  },

  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
    return dbService.addExpense(expense);
  },

  deleteExpense(id: number): boolean {
    return dbService.deleteExpense(id);
  },

  // Search
  globalSearch(query: string): SearchResult {
    return dbService.globalSearch(query);
  },

  // Backup & Restore
  exportDatabaseBinary(): Uint8Array {
    return dbService.exportDatabaseBinary();
  },

  importDatabaseBinary(binary: Uint8Array) {
    dbService.importDatabaseBinary(binary);
  },

  exportBackup(): string {
    const binary = dbService.exportDatabaseBinary();
    const arr = Array.from(binary);
    return JSON.stringify({ version: '1.0', timestamp: new Date().toISOString(), data: arr });
  },

  importBackup(jsonString: string) {
    const parsed = JSON.parse(jsonString);
    if (parsed.data && Array.isArray(parsed.data)) {
      const uint8 = new Uint8Array(parsed.data);
      dbService.importDatabaseBinary(uint8);
    } else {
      throw new Error('Invalid backup file format');
    }
  },

  resetDatabase() {
    dbService.seedInitialData(true);
  },

  getBackupsList(): BackupRecord[] {
    return dbService.getBackupsList();
  },

  recordBackupLog(filename: string, sizeBytes: number, type: 'Manual' | 'Auto') {
    dbService.recordBackupLog(filename, sizeBytes, type);
  }
};
