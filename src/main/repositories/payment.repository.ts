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
}
