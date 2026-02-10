import type {
  Invoice,
  InvoiceWithDetails,
  InvoiceLineItem,
  Payment,
  Customer,
  Sale,
  SaleWithDetails,
  Product,
  InvoiceNumberSequence,
  AuditLog,
} from '@shared/types/entities';

// Repository interfaces define the contract for data access implementations.
// Keep methods small and focused; implementations should return Promises.

export interface InvoiceRepository {
  getById(id: string): Promise<InvoiceWithDetails | null>;
  getAll(): Promise<Invoice[]>;
  create(invoice: Partial<Invoice>): Promise<Invoice>;
  update(id: string, patch: Partial<Invoice>): Promise<void>;
  delete(id: string): Promise<void>;
  addLineItem(line: Partial<InvoiceLineItem>): Promise<InvoiceLineItem>;
  listLineItems(invoiceId: string): Promise<InvoiceLineItem[]>;
}

export interface PaymentRepository {
  getById(id: string): Promise<Payment | null>;
  listByInvoice(invoiceId: string): Promise<Payment[]>;
  create(payment: Partial<Payment>): Promise<Payment>;
}

export interface CustomerRepository {
  getById(id: string): Promise<Customer | null>;
  getAll(): Promise<Customer[]>;
  getActive(): Promise<Customer[]>;
  create(dto: Partial<Customer>): Promise<Customer>;
  update(id: string, patch: Partial<Customer>): Promise<void>;
  merge(sourceCustomerId: string, targetCustomerId: string): Promise<void>;
}

export interface SaleRepository {
  getById(id: string): Promise<Sale | null>;
  getUninvoicedByCustomer(customerId: string): Promise<SaleWithDetails[]>;
  getByCustomer(customerId: string): Promise<SaleWithDetails[]>;
  create(dto: Partial<Sale>): Promise<Sale>;
  update(id: string, patch: Partial<Sale>): Promise<void>;
  markInvoiced(saleIds: string[], invoiceId: string): Promise<void>;
}

export interface ProductRepository {
  getById(id: string): Promise<Product | null>;
  getAll(): Promise<Product[]>;
  create(dto: Partial<Product>): Promise<Product>;
  update(id: string, patch: Partial<Product>): Promise<void>;
}

export interface SequenceRepository {
  getInvoiceSequence(year: number, month?: number): Promise<InvoiceNumberSequence | null>;
  incrementInvoiceSequence(year: number, month?: number): Promise<InvoiceNumberSequence>;
}

export interface AuditRepository {
  log(entry: Partial<AuditLog>): Promise<void>;
  list(entityType?: string, entityId?: string): Promise<AuditLog[]>;
}

export type Repositories = {
  invoice: InvoiceRepository;
  payment: PaymentRepository;
  customer: CustomerRepository;
  sale: SaleRepository;
  product: ProductRepository;
  sequence: SequenceRepository;
  audit: AuditRepository;
};
