/**
 * PaymentService
 * ==============
 * Business logic for payment recording and reconciliation
 * 
 * Responsibilities:
 * - Record payments (partial or full)
 * - Calculate invoice balance
 * - Handle payment methods and references
 * - Trigger invoice status updates when fully paid
 */

import {
  Payment,
  Invoice,
  PaymentDto,
  InvoicePaymentDetail,
  InvoicePaymentSummary,
  CustomerDebtSummary,
} from '../../../shared/types/entities';
import { InvoiceStatus, PaymentMethod, PaymentStatus, AuditAction } from '../../../shared/types/enums';
import { PaymentRepository } from '../../repositories/payment.repository';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { CustomerRepository } from '../../repositories/customer.repository';
import { AuditLogRepository } from '../../repositories/audit-log.repository';

export class PaymentService {
  private customerRepo: CustomerRepository;

  constructor(
    private paymentRepo: PaymentRepository,
    private invoiceRepo: InvoiceRepository,
    private auditRepo: AuditLogRepository,
    customerRepo?: CustomerRepository
  ) {
    this.customerRepo = customerRepo || new CustomerRepository();
  }

  /**
   * Record a payment for an invoice
   * ATOMIC TRANSACTION:
   * 1. Create payment record
   * 2. Calculate total paid / balance
   * 3. If fully paid, update invoice status
   * 4. Log audit entry
   */
  recordPayment(
    invoiceId: string,
    amount: number,
    method: PaymentMethod,
    paidDate: string,
    notes?: string,
    reference?: string
  ): Payment {
    // Validate
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Invoice is already fully paid');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Cannot record payments for cancelled invoices');
    }

    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    // Calculate current balance
    const totalPaid = this.getTotalPaid(invoiceId);
    const balanceDue = invoice.totalAmount - totalPaid;

    if (amount > balanceDue + 0.01) {
      // Allow small rounding errors (0.01)
      throw new Error(
        `Payment amount (${amount}) exceeds balance due (${balanceDue})`
      );
    }

    try {
      // Create payment record
      const payment = this.paymentRepo.create({
        invoiceId,
        amount,
        paidDate,
        method,
        notes: notes ?? undefined,
        reference: reference ?? undefined,
      });

      // Check if invoice is now fully paid
      const newTotal = totalPaid + amount;
      if (newTotal >= invoice.totalAmount - 0.01) {
        // Fully paid (allow for rounding errors)
        const now = new Date().toISOString();
        this.invoiceRepo.update(invoiceId, {
          status: InvoiceStatus.PAID,
          paymentReceivedDate: now,
          paymentMethod: method,
          paymentNotes: notes,
        });
      } else {
        // Partial payment - update payment notes
        this.invoiceRepo.update(invoiceId, {
          paymentNotes: notes,
        });
      }

      // Log audit
      this.auditRepo.log('payment', payment.id, AuditAction.CREATE, null, {
        invoiceId,
        amount,
        method,
        balanceDue,
      });

      return payment;
    } catch (err: any) {
      throw new Error(`Failed to record payment: ${err.message}`);
    }
  }

  /**
   * Get all payments for an invoice
   */
  getPaymentsByInvoice(invoiceId: string): Payment[] {
    return this.paymentRepo.getByInvoiceId(invoiceId);
  }

  /**
   * Get total amount paid for an invoice
   */
  getTotalPaid(invoiceId: string): number {
    return this.paymentRepo.getTotalPaid(invoiceId);
  }

  /**
   * Calculate remaining balance for an invoice
   */
  getBalance(invoiceId: string): number {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const totalPaid = this.getTotalPaid(invoiceId);
    return Math.max(0, invoice.totalAmount - totalPaid);
  }

  /**
   * Get payment summary for an invoice
   */
  getPaymentSummary(invoiceId: string): {
    invoiceTotal: number;
    totalPaid: number;
    balance: number;
    payments: Payment[];
    status: InvoiceStatus;
  } {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const payments = this.getPaymentsByInvoice(invoiceId);
    const totalPaid = this.getTotalPaid(invoiceId);
    const balance = this.getBalance(invoiceId);

    return {
      invoiceTotal: invoice.totalAmount,
      totalPaid,
      balance,
      payments,
      status: invoice.status,
    };
  }

  /**
   * Void/reverse a payment (admin operation)
   * Only allowed for partial payments; full payment invoices need to be reverted to ISSUED first
   */
  reversePayment(paymentId: string, reason?: string): void {
    const payment = this.paymentRepo.getById(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const invoice = this.invoiceRepo.getById(payment.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${payment.invoiceId} not found`);
    }

    try {
      // Remove payment (delete from repo)
      this.paymentRepo.delete(paymentId);

      // Recalculate balance
      const totalPaid = this.getTotalPaid(payment.invoiceId);
      const balance = invoice.totalAmount - totalPaid;

      // If invoice was PAID with this payment, revert to ISSUED
      if (invoice.status === InvoiceStatus.PAID && balance > 0.01) {
        this.invoiceRepo.update(invoice.id, {
          status: InvoiceStatus.ISSUED,
          paymentReceivedDate: null,
        });
      }

      // Log audit
      this.auditRepo.log('payment', paymentId, AuditAction.DELETE, payment, null, reason);
    } catch (err: any) {
      throw new Error(`Failed to reverse payment: ${err.message}`);
    }
  }

  // =========================================================================
  // Debt & Payment Status Tracking
  // =========================================================================

  /**
   * Determine payment status of an invoice
   */
  getInvoicePaymentStatus(invoice: Invoice): PaymentStatus {
    if (invoice.status === InvoiceStatus.PAID) return PaymentStatus.PAID;
    if (invoice.status === InvoiceStatus.CANCELLED) return PaymentStatus.UNPAID;

    const totalPaid = this.paymentRepo.getTotalPaid(invoice.id);
    const remaining = invoice.totalAmount - totalPaid;

    if (remaining <= 0.01) return PaymentStatus.PAID;

    const isOverdue = invoice.dueDate
      ? new Date(invoice.dueDate) < new Date() && remaining > 0.01
      : false;

    if (isOverdue) return PaymentStatus.OVERDUE;
    if (totalPaid > 0) return PaymentStatus.PARTIAL;
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
    return Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get all payments for a customer
   */
  getPaymentsByCustomer(customerId: string): Payment[] {
    return this.paymentRepo.getByCustomerId(customerId);
  }

  /**
   * Get full payment detail for a single invoice
   */
  getInvoicePaymentDetail(invoiceId: string): InvoicePaymentDetail | null {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) return null;

    const payments = this.paymentRepo.getByInvoiceId(invoiceId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = Math.max(0, invoice.totalAmount - totalPaid);
    const paymentStatus = this.getInvoicePaymentStatus(invoice);
    const daysOverdue = this.getDaysOverdue(invoice);
    const isOverdue = daysOverdue > 0 && remainingBalance > 0.01;

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
      netTotal: invoice.totalAmount,
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
   * Get complete debt summary for a customer
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
      const remainingBalance = Math.max(0, invoice.totalAmount - invoicePaid);
      const paymentStatus = this.getInvoicePaymentStatus(invoice);
      const daysOverdue = this.getDaysOverdue(invoice);
      const isOverdue = daysOverdue > 0 && remainingBalance > 0.01;

      totalInvoiced += invoice.totalAmount;
      totalPaid += invoicePaid;

      switch (paymentStatus) {
        case PaymentStatus.PAID: paidInvoiceCount++; break;
        case PaymentStatus.PARTIAL: partiallyPaidInvoiceCount++; break;
        case PaymentStatus.OVERDUE: overdueInvoiceCount++; break;
        case PaymentStatus.UNPAID: unpaidInvoiceCount++; break;
      }

      if (remainingBalance > 0.01) {
        if (!isOverdue) currentDue += remainingBalance;
        else if (daysOverdue <= 30) overdue1to30 += remainingBalance;
        else if (daysOverdue <= 60) overdue31to60 += remainingBalance;
        else if (daysOverdue <= 90) overdue61to90 += remainingBalance;
        else overdue90Plus += remainingBalance;
      }

      if (invoice.createdAt && (!lastInvoiceDate || invoice.createdAt > lastInvoiceDate)) {
        lastInvoiceDate = invoice.createdAt;
      }

      const lastPaymentDate = payments.length > 0 ? payments[0].paidDate : null;

      invoiceDetails.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: customer.name,
        netTotal: invoice.totalAmount,
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
}

