import {
  Payment,
  PaymentDto,
  InvoicePaymentDetail,
  InvoicePaymentSummary,
  CustomerDebtSummary,
  Invoice,
} from '../../shared/types/entities';
import { PaymentRepository } from '../repositories/payment.repository';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { InvoiceStatus, PaymentStatus, AuditAction } from '../../shared/types/enums';
import { AuditLogRepository } from '../repositories/audit-log.repository';

export class PaymentService {
  private paymentRepo = new PaymentRepository();
  private invoiceRepo = new InvoiceRepository();
  private customerRepo = new CustomerRepository();
  private auditRepo = new AuditLogRepository();

  /**
   * Create a payment for an invoice
   * Validates invoice status and updates invoice if fully paid
   */
  create(dto: PaymentDto): Payment {
    const invoice = this.invoiceRepo.getById(dto.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Cannot create payment for cancelled invoice');
    }

    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new Error('Cannot create payment for draft invoice. Issue it first.');
    }

    if (dto.amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    // Check if payment exceeds remaining balance
    const currentPaid = this.paymentRepo.getTotalPaid(dto.invoiceId);
    const remainingBalance = invoice.netTotal - currentPaid;

    if (dto.amount > remainingBalance + 0.01) { // small tolerance for floating point
      throw new Error(
        `Payment amount (${dto.amount}) exceeds remaining balance (${remainingBalance.toFixed(2)})`
      );
    }

    const payment = this.paymentRepo.create(dto);

    // Check if invoice is now fully paid
    const newTotalPaid = currentPaid + dto.amount;
    const newRemaining = invoice.netTotal - newTotalPaid;

    if (newRemaining <= 0.01) {
      // Fully paid - update invoice status
      this.invoiceRepo.markAsPaid(dto.invoiceId, dto.method, undefined);
      this.auditRepo.create('Invoice', dto.invoiceId, AuditAction.MARK_PAID,
        { status: invoice.status, totalPaid: currentPaid },
        { status: InvoiceStatus.PAID, totalPaid: newTotalPaid }
      );
    } else {
      // Partial payment - log it
      this.auditRepo.create('Invoice', dto.invoiceId, AuditAction.PARTIAL_PAYMENT,
        { totalPaid: currentPaid, remainingBalance },
        { totalPaid: newTotalPaid, remainingBalance: newRemaining }
      );
    }

    return payment;
  }

  getById(id: string): Payment | null {
    return this.paymentRepo.getById(id);
  }

  getByInvoiceId(invoiceId: string): Payment[] {
    return this.paymentRepo.getByInvoiceId(invoiceId);
  }

  getAll(): Payment[] {
    return this.paymentRepo.getAll();
  }

  /**
   * Get all payments made by a specific customer
   */
  getByCustomerId(customerId: string): Payment[] {
    return this.paymentRepo.getByCustomerId(customerId);
  }

  delete(id: string): boolean {
    return this.paymentRepo.delete(id);
  }

  /**
   * Get total paid amount for an invoice
   */
  getTotalPayedAmount(invoiceId: string): number {
    return this.paymentRepo.getTotalPaid(invoiceId);
  }

  /**
   * Get remaining amount due for an invoice
   */
  getRemainingAmount(invoiceId: string): number {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) return 0;

    const paidAmount = this.getTotalPayedAmount(invoiceId);
    return Math.max(0, invoice.netTotal - paidAmount);
  }

  // =========================================================================
  // Payment Status Helpers
  // =========================================================================

  /**
   * Determine the payment status of an invoice
   */
  getInvoicePaymentStatus(invoice: Invoice): PaymentStatus {
    if (invoice.status === InvoiceStatus.PAID) {
      return PaymentStatus.PAID;
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      return PaymentStatus.UNPAID; // cancelled invoices are not "due"
    }

    const totalPaid = this.paymentRepo.getTotalPaid(invoice.id);
    const remaining = invoice.netTotal - totalPaid;

    // Check if overdue
    const isOverdue = invoice.dueDate
      ? new Date(invoice.dueDate) < new Date() && remaining > 0.01
      : false;

    if (remaining <= 0.01) {
      return PaymentStatus.PAID;
    }

    if (isOverdue) {
      return PaymentStatus.OVERDUE;
    }

    if (totalPaid > 0) {
      return PaymentStatus.PARTIAL;
    }

    return PaymentStatus.UNPAID;
  }

  /**
   * Calculate days overdue for an invoice
   */
  getDaysOverdue(invoice: Invoice): number {
    if (!invoice.dueDate) return 0;

    const dueDate = new Date(invoice.dueDate);
    const now = new Date();

    if (now <= dueDate) return 0;

    const diffMs = now.getTime() - dueDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // =========================================================================
  // Invoice Payment Detail
  // =========================================================================

  /**
   * Get full payment detail for a single invoice
   */
  getInvoicePaymentDetail(invoiceId: string): InvoicePaymentDetail | null {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) return null;

    const payments = this.paymentRepo.getByInvoiceId(invoiceId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = Math.max(0, invoice.netTotal - totalPaid);
    const paymentStatus = this.getInvoicePaymentStatus(invoice);
    const daysOverdue = this.getDaysOverdue(invoice);
    const isOverdue = daysOverdue > 0 && remainingBalance > 0.01;

    // Get customer name
    let customerName: string | null = null;
    if (invoice.customerId) {
      const customer = this.customerRepo.getById(invoice.customerId);
      customerName = customer?.name ?? null;
    }

    const lastPaymentDate = payments.length > 0 ? payments[0].paidDate : null;

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName,
      netTotal: invoice.netTotal,
      totalPaid,
      remainingBalance,
      paymentStatus,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      lastPaymentDate,
      payments,
      isOverdue,
      daysOverdue,
    };
  }

  /**
   * Get payment summaries for all invoices of a customer
   */
  getCustomerInvoicePaymentSummaries(customerId: string): InvoicePaymentSummary[] {
    const invoices = this.invoiceRepo.getByCustomerId(customerId);

    return invoices
      .filter(inv => inv.status !== InvoiceStatus.CANCELLED)
      .map(invoice => {
        const totalPaid = this.paymentRepo.getTotalPaid(invoice.id);
        const remainingBalance = Math.max(0, invoice.netTotal - totalPaid);
        const paymentStatus = this.getInvoicePaymentStatus(invoice);
        const isOverdue = this.getDaysOverdue(invoice) > 0 && remainingBalance > 0.01;

        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          netTotal: invoice.netTotal,
          totalPaid,
          remainingBalance,
          paymentStatus,
          isOverdue,
        };
      });
  }

  // =========================================================================
  // Customer Debt Summary
  // =========================================================================

  /**
   * Get complete debt summary for a customer
   * Includes: totals, aging buckets, credit info, invoice details
   */
  getCustomerDebtSummary(customerId: string): CustomerDebtSummary | null {
    const customer = this.customerRepo.getById(customerId);
    if (!customer) return null;

    const invoices = this.invoiceRepo.getByCustomerId(customerId);
    const activeInvoices = invoices.filter(inv => inv.status !== InvoiceStatus.CANCELLED);

    let totalInvoiced = 0;
    let totalPaid = 0;
    let paidInvoiceCount = 0;
    let partiallyPaidInvoiceCount = 0;
    let unpaidInvoiceCount = 0;
    let overdueInvoiceCount = 0;

    // Aging buckets
    let currentDue = 0;
    let overdue1to30 = 0;
    let overdue31to60 = 0;
    let overdue61to90 = 0;
    let overdue90Plus = 0;

    let lastInvoiceDate: string | null = null;

    const invoiceDetails: InvoicePaymentDetail[] = [];

    for (const invoice of activeInvoices) {
      const payments = this.paymentRepo.getByInvoiceId(invoice.id);
      const invoicePaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = Math.max(0, invoice.netTotal - invoicePaid);
      const paymentStatus = this.getInvoicePaymentStatus(invoice);
      const daysOverdue = this.getDaysOverdue(invoice);
      const isOverdue = daysOverdue > 0 && remainingBalance > 0.01;

      totalInvoiced += invoice.netTotal;
      totalPaid += invoicePaid;

      // Count by status
      switch (paymentStatus) {
        case PaymentStatus.PAID:
          paidInvoiceCount++;
          break;
        case PaymentStatus.PARTIAL:
          partiallyPaidInvoiceCount++;
          break;
        case PaymentStatus.OVERDUE:
          overdueInvoiceCount++;
          break;
        case PaymentStatus.UNPAID:
          unpaidInvoiceCount++;
          break;
      }

      // Aging buckets (only for unpaid balances)
      if (remainingBalance > 0.01) {
        if (!isOverdue) {
          currentDue += remainingBalance;
        } else if (daysOverdue <= 30) {
          overdue1to30 += remainingBalance;
        } else if (daysOverdue <= 60) {
          overdue31to60 += remainingBalance;
        } else if (daysOverdue <= 90) {
          overdue61to90 += remainingBalance;
        } else {
          overdue90Plus += remainingBalance;
        }
      }

      // Track last invoice date
      if (invoice.createdAt && (!lastInvoiceDate || invoice.createdAt > lastInvoiceDate)) {
        lastInvoiceDate = invoice.createdAt;
      }

      // Get customer name
      let customerName: string | null = null;
      if (invoice.customerId) {
        const cust = this.customerRepo.getById(invoice.customerId);
        customerName = cust?.name ?? null;
      }

      const lastPaymentDate = payments.length > 0 ? payments[0].paidDate : null;

      invoiceDetails.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName,
        netTotal: invoice.netTotal,
        totalPaid: invoicePaid,
        remainingBalance,
        paymentStatus,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        lastPaymentDate,
        payments,
        isOverdue,
        daysOverdue,
      });
    }

    const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);
    const lastPaymentDate = this.paymentRepo.getLastPaymentDateByCustomer(customerId);

    // Credit calculation
    const availableCredit = customer.creditLimit !== null
      ? Math.max(0, customer.creditLimit - totalOutstanding)
      : null;
    const isOverCreditLimit = customer.creditLimit !== null
      ? totalOutstanding > customer.creditLimit
      : false;

    return {
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.customerType,
      creditLimit: customer.creditLimit,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalInvoiceCount: activeInvoices.length,
      paidInvoiceCount,
      partiallyPaidInvoiceCount,
      unpaidInvoiceCount,
      overdueInvoiceCount,
      currentDue,
      overdue1to30,
      overdue31to60,
      overdue61to90,
      overdue90Plus,
      availableCredit,
      isOverCreditLimit,
      lastInvoiceDate,
      lastPaymentDate,
      invoices: invoiceDetails,
    };
  }

  /**
   * Get total outstanding balance for a customer (quick calculation)
   */
  getCustomerOutstandingBalance(customerId: string): number {
    const invoices = this.invoiceRepo.getByCustomerId(customerId);
    let totalOutstanding = 0;

    for (const invoice of invoices) {
      if (invoice.status === InvoiceStatus.CANCELLED) continue;

      const totalPaid = this.paymentRepo.getTotalPaid(invoice.id);
      const remaining = Math.max(0, invoice.netTotal - totalPaid);
      totalOutstanding += remaining;
    }

    return totalOutstanding;
  }

  /**
   * Check if a customer has overdue invoices
   */
  hasOverdueInvoices(customerId: string): boolean {
    const invoices = this.invoiceRepo.getByCustomerId(customerId);

    for (const invoice of invoices) {
      if (invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.PAID) continue;

      const totalPaid = this.paymentRepo.getTotalPaid(invoice.id);
      const remaining = invoice.netTotal - totalPaid;
      const daysOverdue = this.getDaysOverdue(invoice);

      if (remaining > 0.01 && daysOverdue > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if customer is over their credit limit
   */
  isOverCreditLimit(customerId: string): boolean {
    const customer = this.customerRepo.getById(customerId);
    if (!customer || customer.creditLimit === null) return false;

    const outstanding = this.getCustomerOutstandingBalance(customerId);
    return outstanding > customer.creditLimit;
  }
}
