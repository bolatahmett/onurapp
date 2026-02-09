import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import { Invoice, UpdateInvoiceDto } from '../../shared/types/entities';
import { InvoiceStatus } from '../../shared/types/enums';

export class InvoiceRepository extends BaseRepository {
  getAll(): Invoice[] {
    return this.queryAll('SELECT * FROM invoices ORDER BY created_at DESC').map(this.mapRow);
  }

  getById(id: string): Invoice | null {
    const row = this.queryOne('SELECT * FROM invoices WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  getNextInvoiceNumber(): string {
    const row = this.queryOne('SELECT COUNT(*) as count FROM invoices');
    const next = (row?.count ?? 0) + 1;
    const year = new Date().getFullYear();
    return `FTR-${year}-${String(next).padStart(5, '0')}`;
  }

  create(invoiceNumber: string, customerId: string, totalAmount: number, notes?: string, dueDate?: string): Invoice {
    const id = uuidv4();
    const now = this.now();
    this.execute(
      `INSERT INTO invoices (id, invoice_number, customer_id, total_amount, status, issue_date, due_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, invoiceNumber, customerId, totalAmount, InvoiceStatus.DRAFT,
       null, dueDate ?? null, notes ?? null, now, now]
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
      'UPDATE invoices SET status = ?, notes = ?, due_date = ?, issue_date = ?, updated_at = ? WHERE id = ?',
      [
        dto.status ?? invoice.status,
        dto.notes !== undefined ? dto.notes : invoice.notes,
        dto.dueDate !== undefined ? dto.dueDate : invoice.dueDate,
        issueDate, now, id,
      ]
    );
    return this.getById(id);
  }

  updateTotal(id: string, totalAmount: number): void {
    this.execute('UPDATE invoices SET total_amount = ?, updated_at = ? WHERE id = ?',
      [totalAmount, this.now(), id]);
  }

  delete(id: string): boolean {
    this.execute('DELETE FROM invoices WHERE id = ?', [id]);
    return this.changes() > 0;
  }

  private mapRow(row: any): Invoice {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerId: row.customer_id,
      totalAmount: row.total_amount,
      status: row.status as InvoiceStatus,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
