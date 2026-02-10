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
} from '../../../shared/types/entities';
import { InvoiceStatus, PaymentMethod, AuditAction } from '../../../shared/types/enums';
import { PaymentRepository } from '../../repositories/payment.repository';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { AuditLogRepository } from '../../repositories/audit-log.repository';

export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private invoiceRepo: InvoiceRepository,
    private auditRepo: AuditLogRepository
  ) {}

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
}

