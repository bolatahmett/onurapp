export enum TruckStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum UnitType {
  PALLET = 'PALLET',
  CRATE = 'CRATE',
  BOX = 'BOX',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum BackupType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
}
export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CHECK = 'CHECK',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER',
}

export enum CustomerType {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
  SEASONAL = 'SEASONAL',
}

export enum DiscountType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ISSUE = 'ISSUE',
  MARK_PAID = 'MARK_PAID',
  CANCEL = 'CANCEL',
  MERGE = 'MERGE',
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
}

/**
 * Payment status for invoices (calculated from payments)
 * UNPAID: No payments received
 * PARTIAL: Some payments received, balance remaining
 * PAID: Fully paid
 * OVERDUE: Past due date and not fully paid
 */
export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}