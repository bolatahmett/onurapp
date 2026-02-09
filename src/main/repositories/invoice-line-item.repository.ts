import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection';
import { InvoiceLineItem } from '../../shared/types/entities';
import { DiscountType } from '../../shared/types/enums';

export interface CreateInvoiceLineItemDto {
  invoiceId: string;
  saleId?: string;
  sequenceNumber: number;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountAmount: number;
  lineTotal: number;
}

export class InvoiceLineItemRepository {
  create(dto: CreateInvoiceLineItemDto): InvoiceLineItem {
    const db = getDatabase();
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO invoice_line_items 
       (id, invoice_id, sale_id, sequence_number, quantity, unit_price, discount_type, discount_amount, line_total, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.invoiceId,
        dto.saleId || null,
        dto.sequenceNumber,
        dto.quantity,
        dto.unitPrice,
        dto.discountType,
        dto.discountAmount,
        dto.lineTotal,
        createdAt,
      ]
    );

    return this.getById(id)!;
  }

  getById(id: string): InvoiceLineItem | null {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, invoice_id as invoiceId, sale_id as saleId, sequence_number as sequenceNumber,
              quantity, unit_price as unitPrice, discount_type as discountType, discount_amount as discountAmount,
              line_total as lineTotal, created_at as createdAt
       FROM invoice_line_items WHERE id = ?`
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
      saleId: row.saleId,
      sequenceNumber: row.sequenceNumber,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      discountType: row.discountType as DiscountType,
      discountAmount: row.discountAmount,
      lineTotal: row.lineTotal,
      createdAt: row.createdAt,
    };
  }

  getByInvoiceId(invoiceId: string): InvoiceLineItem[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, invoice_id as invoiceId, sale_id as saleId, sequence_number as sequenceNumber,
              quantity, unit_price as unitPrice, discount_type as discountType, discount_amount as discountAmount,
              line_total as lineTotal, created_at as createdAt
       FROM invoice_line_items WHERE invoice_id = ? ORDER BY sequence_number ASC`
    );
    stmt.bind([invoiceId]);

    const items: InvoiceLineItem[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      items.push({
        id: row.id,
        invoiceId: row.invoiceId,
        saleId: row.saleId,
        sequenceNumber: row.sequenceNumber,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        discountType: row.discountType as DiscountType,
        discountAmount: row.discountAmount,
        lineTotal: row.lineTotal,
        createdAt: row.createdAt,
      });
    }
    stmt.free();

    return items;
  }

  deleteByInvoiceId(invoiceId: string): number {
    const db = getDatabase();
    db.run(`DELETE FROM invoice_line_items WHERE invoice_id = ?`, [invoiceId]);
    return db.getRowsModified();
  }

  delete(id: string): boolean {
    const db = getDatabase();
    db.run(`DELETE FROM invoice_line_items WHERE id = ?`, [id]);
    return true;
  }
}
