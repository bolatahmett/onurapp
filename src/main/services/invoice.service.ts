import {
  Invoice,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  MarkInvoicePaidDto,
  InvoicePaymentSummary,
  InvoiceWithDetails,
} from '../../shared/types/entities';
import { InvoiceStatus, AuditAction, PaymentStatus } from '../../shared/types/enums';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { InvoiceNumberSequenceRepository } from '../repositories/invoice-sequence.repository';
import { InvoiceLineItemRepository } from '../repositories/invoice-line-item.repository';
import { SaleRepository } from '../repositories/sale.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { auditService } from './AuditService';

export class InvoiceService {
  private invoiceRepo = new InvoiceRepository();
  private sequenceRepo = new InvoiceNumberSequenceRepository();
  private lineItemRepo = new InvoiceLineItemRepository();
  private saleRepo = new SaleRepository();
  private customerRepo = new CustomerRepository();
  // private auditRepo = new AuditLogRepository(); // Replaced by AuditService
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
    auditService.log('Invoice', invoice.id, 'CREATE', null, JSON.stringify({
      invoiceNumber,
      customerId,
      saleCount: sales.length,
      totalAmount,
    }));

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

    if (invoice.isLocked) {
      throw new Error('Cannot update a locked invoice');
    }

    if (invoice.status !== InvoiceStatus.DRAFT && dto.status === InvoiceStatus.ISSUED) {
      throw new Error('Can only issue invoices from DRAFT status');
    }

    const oldValues = { status: invoice.status, ...dto };
    const updated = this.invoiceRepo.update(id, dto);

    if (updated && dto.status === InvoiceStatus.ISSUED) {
      // Locking is handled by the status change to ISSUED mostly, but we can explicitly set isLocked if needed
      // For now, let's assume ISSUED implies locked for editing logic
      auditService.log('Invoice', id, 'ISSUE', null, JSON.stringify({ status: InvoiceStatus.ISSUED }));
    } else if (updated) {
      auditService.log('Invoice', id, 'UPDATE', null, JSON.stringify(dto));
    }

    return updated;
  }

  /**
   * Mark invoice as paid
   */
  markAsPaid(id: string, dto: MarkInvoicePaidDto, userId?: string): Invoice | null {
    const invoice = this.invoiceRepo.getById(id);
    if (!invoice) return null;

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Invoice is already paid');
    }

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

      // Log payment
      auditService.log('Invoice', id, 'MARK_PAID', userId || null, JSON.stringify({
        status: InvoiceStatus.PAID,
        method: dto.paymentMethod
      }));
    }

    return updated;
  }

  /**
   * Cancel invoice
   */
  cancel(id: string, reason: string, userId?: string): Invoice | null {
    const invoice = this.invoiceRepo.getById(id);
    if (!invoice) return null;

    if (invoice.isLocked) {
      throw new Error('Cannot cancel a locked invoice');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Cannot cancel paid invoice');
    }

    const updated = this.invoiceRepo.cancel(id, reason, userId);

    if (updated) {
      auditService.log('Invoice', id, 'CANCEL', userId || null, JSON.stringify({ reason }));
    }

    return updated;
  }

  /**
   * Delete invoice (only DRAFT)
   */
  delete(id: string): boolean {
    const invoice = this.invoiceRepo.getById(id);
    if (!invoice) return false;

    if (invoice.isLocked) {
      throw new Error('Cannot delete a locked invoice');
    }

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

    // Soft delete
    const success = this.invoiceRepo.delete(id); // Ensure repository handles soft delete or we change it here
    if (success) {
      auditService.log('Invoice', id, 'DELETE', null, 'Soft delete');
    }
    return success;
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

  // =========================================================================
  // Payment Status & Balance Methods
  // =========================================================================

  /**
   * Get payment summary for an invoice (paid/unpaid/partial/overdue + amounts)
   */
  getPaymentSummary(invoiceId: string): InvoicePaymentSummary | null {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) return null;

    const totalPaid = this.paymentRepo.getTotalPaid(invoiceId);
    const remainingBalance = Math.max(0, invoice.netTotal - totalPaid);

    let paymentStatus: PaymentStatus;
    let isOverdue = false;

    if (invoice.status === InvoiceStatus.PAID || remainingBalance <= 0.01) {
      paymentStatus = PaymentStatus.PAID;
    } else if (invoice.status === InvoiceStatus.CANCELLED) {
      paymentStatus = PaymentStatus.UNPAID;
    } else {
      // Check overdue
      if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && remainingBalance > 0.01) {
        paymentStatus = PaymentStatus.OVERDUE;
        isOverdue = true;
      } else if (totalPaid > 0) {
        paymentStatus = PaymentStatus.PARTIAL;
      } else {
        paymentStatus = PaymentStatus.UNPAID;
      }
    }

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      netTotal: invoice.netTotal,
      totalPaid,
      remainingBalance,
      paymentStatus,
      isOverdue,
    };
  }

  /**
   * Get all invoices with payment info for a customer
   */
  getCustomerInvoicesWithPaymentInfo(customerId: string): Array<Invoice & {
    totalPaid: number;
    remainingBalance: number;
    paymentStatus: PaymentStatus;
    isOverdue: boolean;
  }> {
    const invoices = this.invoiceRepo.getByCustomerId(customerId);

    return invoices.map(invoice => {
      const totalPaid = this.paymentRepo.getTotalPaid(invoice.id);
      const remainingBalance = Math.max(0, invoice.netTotal - totalPaid);

      let paymentStatus: PaymentStatus;
      let isOverdue = false;

      if (invoice.status === InvoiceStatus.PAID || remainingBalance <= 0.01) {
        paymentStatus = PaymentStatus.PAID;
      } else if (invoice.status === InvoiceStatus.CANCELLED) {
        paymentStatus = PaymentStatus.UNPAID;
      } else {
        if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && remainingBalance > 0.01) {
          paymentStatus = PaymentStatus.OVERDUE;
          isOverdue = true;
        } else if (totalPaid > 0) {
          paymentStatus = PaymentStatus.PARTIAL;
        } else {
          paymentStatus = PaymentStatus.UNPAID;
        }
      }

      return {
        ...invoice,
        totalPaid,
        remainingBalance,
        paymentStatus,
        isOverdue,
      };
    });
  }

  /**
   * Get overdue invoices with details
   */
  getOverdueInvoices(): Array<Invoice & {
    totalPaid: number;
    remainingBalance: number;
    daysOverdue: number;
    customerName: string | null;
  }> {
    const invoices = this.invoiceRepo.getOutstandingInvoices();
    const now = new Date();

    return invoices
      .filter(invoice => {
        if (!invoice.dueDate) return false;
        return new Date(invoice.dueDate) < now;
      })
      .map(invoice => {
        const totalPaid = this.paymentRepo.getTotalPaid(invoice.id);
        const remainingBalance = Math.max(0, invoice.netTotal - totalPaid);
        const dueDate = new Date(invoice.dueDate!);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        const customer = this.customerRepo.getById(invoice.customerId);

        return {
          ...invoice,
          totalPaid,
          remainingBalance,
          daysOverdue,
          customerName: customer?.name ?? null,
        };
      })
      .filter(inv => inv.remainingBalance > 0.01)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  /**
   * Make a partial payment to an invoice
   */
  makePartialPayment(invoiceId: string, amount: number, method: string, notes?: string): {
    payment: any;
    remainingBalance: number;
    isFullyPaid: boolean;
  } {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Cannot pay cancelled invoice');
    }
    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new Error('Cannot pay draft invoice. Issue it first.');
    }
    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    const currentPaid = this.paymentRepo.getTotalPaid(invoiceId);
    const currentRemaining = invoice.netTotal - currentPaid;

    if (amount > currentRemaining + 0.01) {
      throw new Error(`Payment (${amount}) exceeds remaining balance (${currentRemaining.toFixed(2)})`);
    }

    const payment = this.paymentRepo.create({
      invoiceId,
      amount,
      paidDate: new Date().toISOString(),
      method: method as any,
      notes,
    });

    const newTotalPaid = currentPaid + amount;
    const remainingBalance = Math.max(0, invoice.netTotal - newTotalPaid);
    const isFullyPaid = remainingBalance <= 0.01;

    if (isFullyPaid) {
      this.invoiceRepo.markAsPaid(invoiceId, method as any, undefined);
      auditService.log('Invoice', invoiceId, 'MARK_PAID', null, JSON.stringify({
        status: InvoiceStatus.PAID,
        totalPaid: newTotalPaid
      }));
    } else {
      auditService.log('Invoice', invoiceId, 'PARTIAL_PAYMENT', null, JSON.stringify({
        amount,
        newTotalPaid,
        remainingBalance
      }));
    }

    return { payment, remainingBalance, isFullyPaid };
  }
}
