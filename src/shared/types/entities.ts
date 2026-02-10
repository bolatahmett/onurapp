import {
  TruckStatus,
  UnitType,
  InvoiceStatus,
  BackupType,
  PaymentMethod,
  CustomerType,
  DiscountType,
  AuditAction,
  PaymentStatus,
  UserRole,
} from './enums';

// ============================================================================
// EXISTING ENTITIES (Enhanced)
// ============================================================================

export interface Truck extends BaseEntity {
  plateNumber: string;
  driverName: string | null;
  driverPhone: string | null;
  arrivalDate: string;
  departureDate: string | null;
  status: TruckStatus;
  notes: string | null;
}

export interface Product extends BaseEntity {
  name: string;
  variety: string | null;
  defaultUnitType: UnitType;
  code: string | null;
  category: string | null;
  basePrice: number | null;
  isActive: boolean;
}

export interface Customer extends BaseEntity {
  name: string;
  phone: string | null;
  address: string | null;
  email: string | null;
  taxId: string | null;
  taxNumber: string | null;
  contactPerson: string | null;
  creditLimit: number | null;
  paymentTerms: string | null;
  customerType: CustomerType;
  mergedFromId: string | null;
  isTemporary: boolean;
  isActive: boolean;
}

export interface Sale extends BaseEntity {
  truckId: string;
  productId: string;
  customerId: string | null;
  invoiceId: string | null;
  unitType: UnitType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountType: DiscountType;
  discountAmount: number;
  discountReason: string | null;
  sellerName: string | null;
  paymentMethod: string | null;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  autoInvoice: boolean;
  saleDate: string;
  notes: string | null;
}

export interface SaleWithDetails extends Sale {
  truckPlateNumber: string;
  productName: string;
  customerName: string | null;
  invoiceNumber: string | null;
  remainingInventory: number;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  customerId: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  netTotal: number;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  paymentReceivedDate: string | null;
  paymentMethod: string | null;
  paymentNotes: string | null;
  issuedByUserId: string | null;
  paidByUserId: string | null;
  cancelledByUserId: string | null;
  cancellationReason: string | null;
  notes: string | null;
  isLocked: boolean;
}

export interface InvoiceWithDetails extends Invoice {
  customerName: string;
  sales: SaleWithDetails[];
}

export interface BackupLog {
  id: string;
  filePath: string;
  type: BackupType;
  sizeBytes: number;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

// ============================================================================
// NEW ENTITIES
// ============================================================================

export interface TruckInventory {
  id: string;
  truckId: string;
  productId: string;
  quantity: number;
  unitType: UnitType;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  saleId: string | null;
  sequenceNumber: number;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountAmount: number;
  lineTotal: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paidDate: string;
  method: PaymentMethod | null;
  notes: string | null;
  reference: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string | null;
  details: string | null;
  createdAt: string;
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface InvoiceNumberSequence {
  id: string;
  year: number;
  month: number;
  lastSequence: number;
}

export interface CustomerMerge {
  id: string;
  sourceCustomerId: string;
  targetCustomerId: string;
  mergedAt: string;
  mergedByUserId: string | null;
}

// ============================================================================
// DTOs for creating/updating
// ============================================================================

export interface CreateTruckDto {
  plateNumber: string;
  driverName?: string;
  driverPhone?: string;
  arrivalDate?: string;
  notes?: string;
}

export interface UpdateTruckDto {
  plateNumber?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
}

export interface CreateProductDto {
  name: string;
  variety?: string;
  defaultUnitType: UnitType;
  code?: string;
  category?: string;
  basePrice?: number;
}

export interface UpdateProductDto {
  name?: string;
  variety?: string;
  defaultUnitType?: UnitType;
  code?: string;
  category?: string;
  basePrice?: number;
  isActive?: boolean;
}

export interface CreateTruckInventoryDto {
  productId: string;
  quantity: number;
  unitType: UnitType;
}

export interface UpdateTruckInventoryDto {
  quantity?: number;
  unitType?: UnitType;
}

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  taxId?: string;
  taxNumber?: string;
  contactPerson?: string;
  creditLimit?: number;
  paymentTerms?: string;
  customerType?: CustomerType;
  isTemporary?: boolean;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  taxId?: string;
  taxNumber?: string;
  contactPerson?: string;
  creditLimit?: number;
  paymentTerms?: string;
  customerType?: CustomerType;
  isTemporary?: boolean;
  isActive?: boolean;
}

export interface CreateSaleDto {
  truckId: string;
  productId: string;
  customerId?: string;
  unitType: UnitType;
  quantity: number;
  unitPrice: number;
  discountType?: DiscountType;
  discountAmount?: number;
  discountReason?: string;
  sellerName?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  autoInvoice?: boolean;
  paidAmount?: number;
}

export interface UpdateSaleDto {
  customerId?: string | null;
  invoiceId?: string | null;
  unitType?: UnitType;
  quantity?: number;
  unitPrice?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  discountReason?: string;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  notes?: string;
}

export interface CreateInvoiceDto {
  customerId: string;
  saleIds: string[];
  notes?: string;
  dueDate?: string;
  taxRate?: number;
}

export interface UpdateInvoiceDto {
  customerId?: string;
  status?: InvoiceStatus;
  notes?: string;
  dueDate?: string;
  taxRate?: number;
  issueDate?: string;
  paymentReceivedDate?: string | null;
  paymentMethod?: string;
  paymentNotes?: string;
}

export interface MarkInvoicePaidDto {
  paymentMethod: PaymentMethod;
  paidDate: string;
  paymentNotes?: string;
  paidByUserId?: string;
}

export interface PaymentDto {
  invoiceId: string;
  amount: number;
  paidDate: string;
  method: PaymentMethod;
  notes?: string;
  reference?: string;
}

export interface MergeCustomerDto {
  sourceCustomerId: string;
  targetCustomerId: string;
  mergedByUserId?: string;
}

// ============================================================================
// Report types
// ============================================================================

export interface DailySummary {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalTrucks: number;
  truckBreakdown: TruckSummary[];
}

export interface ProductSummary {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  saleCount: number;
}

export interface CustomerSummary {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  totalAmount: number;
  outstandingInvoices: number;
  lastPurchaseDate: string | null;
}

export interface TruckSummary {
  truckId: string;
  plateNumber: string;
  arrivalDate: string;
  totalSales: number;
  totalRevenue: number;
}

export interface RevenueSummary {
  period: string;
  totalRevenue: number;
  invoiceCount: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface CustomerHistoryEntry {
  saleId: string;
  saleDate: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  invoiceNumber: string | null;
  invoiceStatus: InvoiceStatus | null;
}

// ============================================================================
// Payment & Debt Tracking Types
// ============================================================================

/**
 * Detailed payment info for a single invoice
 * Shows: total amount, paid amount, remaining balance, payment status
 */
export interface InvoicePaymentDetail {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string | null;
  netTotal: number;
  totalPaid: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  issueDate: string | null;
  dueDate: string | null;
  lastPaymentDate: string | null;
  payments: Payment[];
  isOverdue: boolean;
  daysOverdue: number;
}

/**
 * Complete debt summary for a single customer
 * Shows: total debt, paid amount, remaining balance, aging buckets
 */
export interface CustomerDebtSummary {
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  creditLimit: number | null;

  // Overall totals
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;

  // Invoice counts
  totalInvoiceCount: number;
  paidInvoiceCount: number;
  partiallyPaidInvoiceCount: number;
  unpaidInvoiceCount: number;
  overdueInvoiceCount: number;

  // Aging buckets (days overdue)
  currentDue: number;       // not yet due
  overdue1to30: number;     // 1-30 days overdue
  overdue31to60: number;    // 31-60 days overdue
  overdue61to90: number;    // 61-90 days overdue
  overdue90Plus: number;    // 90+ days overdue

  // Credit info
  availableCredit: number | null; // creditLimit - totalOutstanding
  isOverCreditLimit: boolean;

  // Last activity
  lastInvoiceDate: string | null;
  lastPaymentDate: string | null;

  // Detailed invoice list
  invoices: InvoicePaymentDetail[];
}

/**
 * Payment summary for an invoice (lightweight version)
 */
export interface InvoicePaymentSummary {
  invoiceId: string;
  invoiceNumber: string;
  netTotal: number;
  totalPaid: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  isOverdue: boolean;
}

/**
 * Debt aging report across all customers
 */
export interface DebtAgingReport {
  totalOutstanding: number;
  totalOverdue: number;
  currentDue: number;
  overdue1to30: number;
  overdue31to60: number;
  overdue61to90: number;
  overdue90Plus: number;
  customerCount: number;
  overdueCustomerCount: number;
  customers: CustomerDebtSummary[];
}

export interface User extends BaseEntity {
  username: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateUserDto {
  username: string;
  password?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserDto {
  password?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface LoginDto {
  username: string;
  password?: string;
}
