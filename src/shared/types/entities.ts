import { 
  TruckStatus, 
  UnitType, 
  InvoiceStatus, 
  BackupType,
  PaymentMethod,
  CustomerType,
  DiscountType,
  AuditAction,
} from './enums';

// ============================================================================
// EXISTING ENTITIES (Enhanced)
// ============================================================================

export interface Truck {
  id: string;
  plateNumber: string;
  driverName: string | null;
  driverPhone: string | null;
  arrivalDate: string;
  departureDate: string | null;
  status: TruckStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  variety: string | null;
  defaultUnitType: UnitType;
  code: string | null;
  category: string | null;
  basePrice: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
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
  saleDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaleWithDetails extends Sale {
  truckPlateNumber: string;
  productName: string;
  customerName: string | null;
  invoiceNumber: string | null;
}

export interface Invoice {
  id: string;
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
  createdAt: string;
  updatedAt: string;
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
  action: AuditAction;
  oldValues: string | null;
  newValues: string | null;
  userId: string | null;
  timestamp: string;
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
  paymentMethod?: string;
  notes?: string;
  createInvoice?: boolean;
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
