import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection';
import { InvoiceNumberSequence } from '../../shared/types/entities';

export class InvoiceNumberSequenceRepository {
  /**
   * Generate next invoice number for given year and month
   * Format: INV-YYYY-MM-XXX (e.g., INV-2026-02-001)
   */
  getNextInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return this.getNextNumberForYearMonth(year, month);
  }

  getNextNumberForYearMonth(year: number, month: number): string {
    const db = getDatabase();

    // Try to get existing sequence
    const stmt = db.prepare(
      `SELECT id, last_sequence as lastSequence 
       FROM invoice_number_sequences 
       WHERE year = ? AND month = ?`
    );
    stmt.bind([year, month]);

    let sequence: InvoiceNumberSequence | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      sequence = {
        id: row.id,
        year,
        month,
        lastSequence: row.lastSequence,
      };
    }
    stmt.free();

    if (!sequence) {
      // Create new sequence record
      const id = uuidv4();
      db.run(
        `INSERT INTO invoice_number_sequences (id, year, month, last_sequence) VALUES (?, ?, ?, ?)`,
        [id, year, month, 0]
      );
      sequence = {
        id,
        year,
        month,
        lastSequence: 0,
      };
    }

    // Increment and update
    const nextSequence = sequence.lastSequence + 1;
    db.run(
      `UPDATE invoice_number_sequences SET last_sequence = ? WHERE id = ?`,
      [nextSequence, sequence.id]
    );

    // Format: INV-YYYY-MM-XXX
    const paddedSequence = String(nextSequence).padStart(3, '0');
    return `INV-${year}-${String(month).padStart(2, '0')}-${paddedSequence}`;
  }

  getSequence(year: number, month: number): InvoiceNumberSequence | null {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, year, month, last_sequence as lastSequence 
       FROM invoice_number_sequences 
       WHERE year = ? AND month = ?`
    );
    stmt.bind([year, month]);

    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.getAsObject() as any;
    stmt.free();

    return {
      id: row.id,
      year: row.year,
      month: row.month,
      lastSequence: row.lastSequence,
    };
  }

  getAllSequences(): InvoiceNumberSequence[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, year, month, last_sequence as lastSequence 
       FROM invoice_number_sequences 
       ORDER BY year DESC, month DESC`
    );

    const sequences: InvoiceNumberSequence[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      sequences.push({
        id: row.id,
        year: row.year,
        month: row.month,
        lastSequence: row.lastSequence,
      });
    }
    stmt.free();

    return sequences;
  }

  resetSequenceForYearMonth(year: number, month: number): void {
    const db = getDatabase();
    db.run(
      `UPDATE invoice_number_sequences SET last_sequence = 0 WHERE year = ? AND month = ?`,
      [year, month]
    );
  }
}
