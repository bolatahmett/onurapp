import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import { Invoice, UpdateInvoiceDto, CreateInvoiceDto, InvoiceLineItem } from '../../shared/types/entities';
import { InvoiceStatus, PaymentMethod } from '../../shared/types/enums';

export class InvoiceRepository extends BaseRepository {
  getAll(): Invoice[] {
    return this.queryAll('SELECT * FROM invoices ORDER BY created_at DESC').map(this.mapRow);
  }

  getById(id: string): Invoice | null {
    const row = this.queryOne('SELECT * FROM invoices WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  getByCustomerId(customerId: string): Invoice[] {
    return this.queryAll(
      'SELECT * FROM invoices WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    ).map(this.mapRow);
  }

  getByStatus(status: InvoiceStatus): Invoice[] {
    return this.queryAll(
      'SELECT * FROM invoices WHERE status = ? ORDER BY created_at DESC',
      [status]
    ).map(this.mapRow);
  }

  getOutstandingInvoices(): Invoice[] {
    return this.queryAll(
      `SELECT * FROM invoices WHERE status = ? OR status = ? ORDER BY due_date ASC`,
      [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED]
    ).map(this.mapRow);
  }

  create(invoiceNumber: string, customerId: string, dto: CreateInvoiceDto): Invoice {
    const id = uuidv4();
    const now = this.now();
    this.execute(
      `INSERT INTO invoices (id, invoice_number, customer_id, total_amount, subtotal, tax_amount, tax_rate, net_total,
                            status, issue_date, due_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, invoiceNumber, customerId, 0, 0, 0, dto.taxRate ?? 0, 0, InvoiceStatus.DRAFT,
       null, dto.dueDate ?? null, dto.notes ?? null, now, now]
    );
    return this.getById(id)!;
  }

  update(id: string, dto: UpdateInvoiceDto): Invoice | null {
    const invoice = this.getById(id);
    if (!invoice) return null;
    const now = this.now();
    const issueDate =
      dto.status === InvoiceStatus.ISSUED && invoice.status === InvoiceStatus.DRAFT
        ? now : invoice.issueDate;

    this.execute(
      `UPDATE invoices SET status = ?, notes = ?, due_date = ?, tax_rate = ?, issue_date = ?, updated_at = ? WHERE id = ?`,
      [
        dto.status ?? invoice.status,
        dto.notes !== undefined ? dto.notes : invoice.notes,
        dto.dueDate !== undefined ? dto.dueDate : invoice.dueDate,
        dto.taxRate !== undefined ? dto.taxRate : invoice.taxRate,
        issueDate, now, id,
      ]
    );
    return this.getById(id);
  }

  updateTotals(id: string, subtotal: number, taxRate: number): void {
    const taxAmount = subtotal * (taxRate / 100);
    const netTotal = subtotal + taxAmount;
    this.execute(
      `UPDATE invoices SET subtotal = ?, tax_amount = ?, net_total = ?, total_amount = ?, updated_at = ? WHERE id = ?`,
      [subtotal, taxAmount, netTotal, netTotal, this.now(), id]
    );
  }

  markAsPaid(id: string, paymentMethod: PaymentMethod, paidByUserId?: string): Invoice | null {
    const invoice = this.getById(id);
    if (!invoice) return null;
    const now = this.now();
    this.execute(
      `UPDATE invoices SET status = ?, payment_received_date = ?, payment_method = ?, paid_by_user_id = ?, updated_at = ? WHERE id = ?`,
      [InvoiceStatus.PAID, now, paymentMethod, paidByUserId ?? null, now, id]
    );
    return this.getById(id);
  }

  cancel(id: string, cancellationReason: string, cancelledByUserId?: string): Invoice | null {
    const invoice = this.getById(id);
    if (!invoice) return null;
    const now = this.now();
    this.execute(
      `UPDATE invoices SET status = ?, cancelled_by_user_id = ?, cancellation_reason = ?, updated_at = ? WHERE id = ?`,
      [InvoiceStatus.CANCELLED, cancelledByUserId ?? null, cancellationReason, now, id]
    );
    return this.getById(id);
  }

  delete(id: string): boolean {
    this.execute('DELETE FROM invoices WHERE id = ?', [id]);
    return this.changes() > 0;
  }

  getLineItems(invoiceId: string): InvoiceLineItem[] {
    return this.queryAll(
      'SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY sequence_number ASC',
      [invoiceId]
    ).map(row => ({
      id: row.id,
      invoiceId: row.invoice_id,
      saleId: row.sale_id,
      sequenceNumber: row.sequence_number,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      discountType: row.discount_type,
      discountAmount: row.discount_amount ?? 0,
      lineTotal: row.line_total,
      createdAt: row.created_at,
    }));
  }

  private mapRow(row: any): Invoice {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerId: row.customer_id,
      totalAmount: row.total_amount,
      subtotal: row.subtotal,
      taxAmount: row.tax_amount,
      taxRate: row.tax_rate,
      netTotal: row.net_total,
      status: row.status as InvoiceStatus,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      paymentReceivedDate: row.payment_received_date,
      paymentMethod: row.payment_method,
      paymentNotes: row.payment_notes,
      issuedByUserId: row.issued_by_user_id,
      paidByUserId: row.paid_by_user_id,
      cancelledByUserId: row.cancelled_by_user_id,
      cancellationReason: row.cancellation_reason,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
