import { 
  Invoice, 
  CreateInvoiceDto, 
  UpdateInvoiceDto,
  MarkInvoicePaidDto,
} from '../../shared/types/entities';
import { InvoiceStatus, AuditAction } from '../../shared/types/enums';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { InvoiceNumberSequenceRepository } from '../repositories/invoice-sequence.repository';
import { InvoiceLineItemRepository } from '../repositories/invoice-line-item.repository';
import { SaleRepository } from '../repositories/sale.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { PaymentRepository } from '../repositories/payment.repository';

export class InvoiceService {
  private invoiceRepo = new InvoiceRepository();
  private sequenceRepo = new InvoiceNumberSequenceRepository();
  private lineItemRepo = new InvoiceLineItemRepository();
  private saleRepo = new SaleRepository();
  private customerRepo = new CustomerRepository();
  private auditRepo = new AuditLogRepository();
  private paymentRepo = new PaymentRepository();

  /**
   * Create a new invoice from selected sales
   */
  create(customerId: string, saleIds: string[], dto: CreateInvoiceDto): Invoice {
    if (!saleIds || saleIds.length === 0) {
      throw new Error('At least one sale must be selected');
    }

    const customer = this.customerRepo.getById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get all sales and validate
    const sales = saleIds.map(id => this.saleRepo.getById(id)).filter(s => s !== null);
    
    if (sales.length !== saleIds.length) {
      throw new Error('Some sales not found');
    }

    // Generate invoice number
    const invoiceNumber = this.sequenceRepo.getNextInvoiceNumber();

    // Create invoice
    const invoice = this.invoiceRepo.create(invoiceNumber, customerId, dto);

    // Create line items and calculate totals
    let totalAmount = 0;
    sales.forEach((sale, index) => {
      const lineTotal = sale.totalPrice;
      totalAmount += lineTotal;

      this.lineItemRepo.create({
        invoiceId: invoice.id,
        saleId: sale.id,
        sequenceNumber: index + 1,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        discountType: sale.discountType,
        discountAmount: sale.discountAmount,
        lineTotal: sale.totalPrice,
      });

      // Link sale to invoice
      this.saleRepo.linkToInvoice([sale.id], invoice.id);
    });

    // Update invoice totals
    const taxRate = dto.taxRate ?? 0;
    this.invoiceRepo.updateTotals(invoice.id, totalAmount, taxRate);

    // Log creation
    this.auditRepo.create('Invoice', invoice.id, AuditAction.CREATE, null, {
      invoiceNumber,
      customerId,
      saleCount: sales.length,
      totalAmount,
    });

    return this.invoiceRepo.getById(invoice.id)!;
  }

  /**
   * Get invoice by ID
   */
  getById(id: string): Invoice | null {
    return this.invoiceRepo.getById(id);
  }

  /**
   * Get all invoices for a customer
   */
  getByCustomerId(customerId: string): Invoice[] {
    return this.invoiceRepo.getByCustomerId(customerId);
  }

  /**
   * Get all invoices
   */
  getAll(): Invoice[] {
    return this.invoiceRepo.getAll();
  }

  /**
   * Get invoices by status
   */
  getByStatus(status: InvoiceStatus): Invoice[] {
    return this.invoiceRepo.getByStatus(status);
  }

  /**
   * Get all outstanding invoices (DRAFT or ISSUED)
   */
  getOutstandingInvoices(): Invoice[] {
    return this.invoiceRepo.getOutstandingInvoices();
  }

  /**
   * Update invoice
   */
  update(id: string, dto: UpdateInvoiceDto): Invoice | null {
    const invoice = this.invoiceRepo.getById(id);
    if (!invoice) return null;

    if (invoice.status !== InvoiceStatus.DRAFT && dto.status === InvoiceStatus.ISSUED) {
      throw new Error('Can only issue invoices from DRAFT status');
    }

    const oldValues = { status: invoice.status, ...dto };
    const updated = this.invoiceRepo.update(id, dto);

    if (updated && dto.status === InvoiceStatus.ISSUED) {
      this.auditRepo.create('Invoice', id, AuditAction.ISSUE, oldValues, { status: InvoiceStatus.ISSUED });
    }

    return updated;
  }

  /**
   * Mark invoice as paid
   */
  markAsPaid(id: string, dto: MarkInvoicePaidDto, userId?: string): Invoice | null {
    const invoice = this.invoiceRepo.getById(id);
    if (!invoice) return null;

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Cannot mark cancelled invoice as paid');
    }

    const updated = this.invoiceRepo.markAsPaid(id, dto.paymentMethod, dto.paidByUserId || userId);

    // Create payment record
    if (updated) {
      this.paymentRepo.create({
        invoiceId: id,
        amount: updated.netTotal,
        paidDate: dto.paidDate,
        method: dto.paymentMethod,
        notes: dto.paymentNotes,
      });

      this.auditRepo.create('Invoice', id, AuditAction.MARK_PAID, { status: invoice.status }, { status: InvoiceStatus.PAID });
    }

    return updated;
  }

  /**
   * Cancel invoice
   */
  cancel(id: string, reason: string, userId?: string): Invoice | null {
    const invoice = this.invoiceRepo.getById(id);
    if (!invoice) return null;

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Cannot cancel paid invoice');
    }

    const updated = this.invoiceRepo.cancel(id, reason, userId);

    if (updated) {
      this.auditRepo.create('Invoice', id, AuditAction.CANCEL, { status: invoice.status }, { reason });
    }

    return updated;
  }

  /**
   * Delete invoice (only DRAFT)
   */
  delete(id: string): boolean {
    const invoice = this.invoiceRepo.getById(id);
    if (!invoice) return false;

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Can only delete DRAFT invoices');
    }

    // Unlink sales
    const lineItems = this.lineItemRepo.getByInvoiceId(id);
    lineItems.forEach(item => {
      if (item.saleId) {
        this.saleRepo.linkToInvoice([item.saleId], null);
      }
    });

    // Delete line items
    this.lineItemRepo.deleteByInvoiceId(id);

    return this.invoiceRepo.delete(id);
  }

  /**
   * Get line items for invoice
   */
  getLineItems(invoiceId: string) {
    return this.lineItemRepo.getByInvoiceId(invoiceId);
  }

  /**
   * Get payments for invoice
   */
  getPayments(invoiceId: string) {
    return this.paymentRepo.getByInvoiceId(invoiceId);
  }
}
