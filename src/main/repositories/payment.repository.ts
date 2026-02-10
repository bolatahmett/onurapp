import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection';
import { Payment, PaymentDto } from '../../shared/types/entities';

export class PaymentRepository {
  create(dto: PaymentDto): Payment {
    const db = getDatabase();
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO payments (id, invoice_id, amount, paid_date, method, notes, reference, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dto.invoiceId, dto.amount, dto.paidDate, dto.method, dto.notes || null, dto.reference || null, createdAt]
    );

    return this.getById(id)!;
  }

  getById(id: string): Payment | null {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, invoice_id as invoiceId, amount, paid_date as paidDate, method, notes, reference, created_at as createdAt
       FROM payments WHERE id = ?`
    );
    stmt.bind([id]);

    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.getAsObject() as any;
    stmt.free();

    return {
      id: row.id,
      invoiceId: row.invoiceId,
      amount: row.amount,
      paidDate: row.paidDate,
      method: row.method,
      notes: row.notes,
      reference: row.reference,
      createdAt: row.createdAt,
    };
  }

  getByInvoiceId(invoiceId: string): Payment[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, invoice_id as invoiceId, amount, paid_date as paidDate, method, notes, reference, created_at as createdAt
       FROM payments WHERE invoice_id = ? ORDER BY paid_date DESC`
    );
    stmt.bind([invoiceId]);

    const payments: Payment[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      payments.push({
        id: row.id,
        invoiceId: row.invoiceId,
        amount: row.amount,
        paidDate: row.paidDate,
        method: row.method,
        notes: row.notes,
        reference: row.reference,
        createdAt: row.createdAt,
      });
    }
    stmt.free();

    return payments;
  }

  getAll(): Payment[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, invoice_id as invoiceId, amount, paid_date as paidDate, method, notes, reference, created_at as createdAt
       FROM payments ORDER BY paid_date DESC`
    );

    const payments: Payment[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      payments.push({
        id: row.id,
        invoiceId: row.invoiceId,
        amount: row.amount,
        paidDate: row.paidDate,
        method: row.method,
        notes: row.notes,
        reference: row.reference,
        createdAt: row.createdAt,
      });
    }
    stmt.free();

    return payments;
  }

  delete(id: string): boolean {
    const db = getDatabase();
    db.run(`DELETE FROM payments WHERE id = ?`, [id]);
    return true;
  }

  getTotalPaid(invoiceId: string): number {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as totalPaid FROM payments WHERE invoice_id = ?`
    );
    stmt.bind([invoiceId]);

    let totalPaid = 0;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      totalPaid = row.totalPaid || 0;
    }
    stmt.free();

    return totalPaid;
  }

  /**
   * Get all payments for a customer (across all invoices)
   */
  getByCustomerId(customerId: string): Payment[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT p.id, p.invoice_id as invoiceId, p.amount, p.paid_date as paidDate,
              p.method, p.notes, p.reference, p.created_at as createdAt
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE i.customer_id = ?
       ORDER BY p.paid_date DESC`
    );
    stmt.bind([customerId]);

    const payments: Payment[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      payments.push({
        id: row.id,
        invoiceId: row.invoiceId,
        amount: row.amount,
        paidDate: row.paidDate,
        method: row.method,
        notes: row.notes,
        reference: row.reference,
        createdAt: row.createdAt,
      });
    }
    stmt.free();

    return payments;
  }

  /**
   * Get total paid amount across all invoices for a customer
   */
  getTotalPaidByCustomer(customerId: string): number {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT COALESCE(SUM(p.amount), 0) as totalPaid
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE i.customer_id = ? AND i.status != 'CANCELLED'`
    );
    stmt.bind([customerId]);

    let totalPaid = 0;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      totalPaid = row.totalPaid || 0;
    }
    stmt.free();

    return totalPaid;
  }

  /**
   * Get the last payment date for a customer
   */
  getLastPaymentDateByCustomer(customerId: string): string | null {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT MAX(p.paid_date) as lastDate
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE i.customer_id = ?`
    );
    stmt.bind([customerId]);

    let lastDate: string | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      lastDate = row.lastDate || null;
    }
    stmt.free();

    return lastDate;
  }
}
