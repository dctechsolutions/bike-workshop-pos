/**
 * Bike Workshop Manager - Data Models & Types
 */

export type JobStatus = 
  | 'Received'
  | 'Inspection'
  | 'In Progress'
  | 'Waiting for Parts'
  | 'Ready'
  | 'Delivered'
  | 'Cancelled';

export type JobPriority = 'Normal' | 'Urgent';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Other';

export type InvoiceStatus = 'Paid' | 'Partial' | 'Unpaid';

export type StockMovementType = 
  | 'Purchase'
  | 'Repair Usage'
  | 'Sale'
  | 'Manual Adjustment'
  | 'Return';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
  // Computed fields
  totalSpent?: number;
  bikeCount?: number;
  jobCount?: number;
}

export interface Bike {
  id: number;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  regNumber: string;
  company: string;
  model: string;
  modelYear?: string;
  engineNum?: string;
  chassisNum?: string;
  mileage?: number;
  color?: string;
  notes?: string;
  createdAt: string;
}

export interface SparePart {
  id: number;
  name: string;
  category: string;
  brand: string;
  partNumber?: string;
  compatibleCompany?: string;
  compatibleModel?: string;
  purchasePrice: number;
  sellingPrice: number;
  currentQty: number;
  minStock: number;
  supplierId?: number;
  supplierName?: string;
  rackLocation?: string;
  description?: string;
  notes?: string;
  createdAt: string;
}

export interface StockMovement {
  id: number;
  partId: number;
  partName?: string;
  qty: number; // positive for increase, negative for decrease
  type: StockMovementType;
  reason: string;
  userAction: string;
  referenceId?: string;
  createdAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  company?: string;
  address?: string;
  outstandingBalance: number;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id?: number;
  purchaseId?: number;
  partId: number;
  partName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName?: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  notes?: string;
  createdAt: string;
}

export interface RepairJobItem {
  id?: number;
  jobId?: number;
  partId: number;
  partName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface RepairJob {
  id: number;
  jobNumber: string;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  bikeId: number;
  bikeCompany?: string;
  bikeModel?: string;
  bikeRegNumber?: string;
  date: string;
  expectedDelivery?: string;
  currentMileage?: number;
  complaint: string;
  initialInspection?: string;
  workRequired?: string;
  workDone?: string;
  mechanicAssigned?: string;
  priority: JobPriority;
  status: JobStatus;
  labourCost: number;
  labourDescription?: string;
  parts: RepairJobItem[];
  notes?: string;
  createdAt: string;
  invoiceId?: number;
}

export interface InvoiceItem {
  id?: number;
  invoiceId?: number;
  partId?: number;
  itemType: 'Part' | 'Labour' | 'Other';
  description: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  jobId?: number;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  bikeId?: number;
  bikeRegNumber?: string;
  bikeModel?: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  labourAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  title?: string;
  note?: string;
  description?: string;
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  subtitle?: string;
  tagline?: string;
  shopAddress?: string;
  address?: string;
  shopPhone?: string;
  phone?: string;
  currency: string;
  invoiceFooter?: string;
  terms?: string;
  lowStockThreshold?: number;
  defaultLabourCost?: number;
  invoicePrintFormat?: 'thermal_80mm' | 'a4_full';
  autoBackupEnabled?: boolean;
  allowNegativeStock?: boolean;
}

export interface BackupRecord {
  id: number;
  filename: string;
  sizeBytes: number;
  type: 'Manual' | 'Auto';
  createdAt: string;
}

export interface DashboardSummary {
  todayRevenue: number;
  todayJobsCount: number;
  bikesReceivedToday: number;
  bikesInProgress: number;
  bikesReady: number;
  bikesDeliveredToday: number;
  todaySales: number;
  todayLabourCharges: number;
  todayExpenses: number;
  todayNetAmount: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingJobsCount: number;
  jobsInProgress: number;
  pendingPaymentsAmount: number;
  unpaidSupplierDues: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  totalInventoryValue: number;
}

export interface SearchResult {
  customers: Customer[];
  bikes: Bike[];
  jobs: RepairJob[];
  parts: SparePart[];
  invoices: Invoice[];
}
