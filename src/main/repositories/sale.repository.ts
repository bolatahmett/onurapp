import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import { Sale, SaleWithDetails, CreateSaleDto, UpdateSaleDto } from '../../shared/types/entities';
import { UnitType } from '../../shared/types/enums';

export class SaleRepository extends BaseRepository {
  private readonly selectWithDetails = `
    SELECT s.*,
      t.plate_number as truck_plate_number,
      p.name as product_name,
      c.name as customer_name,
      i.invoice_number
    FROM sales s
    JOIN trucks t ON s.truck_id = t.id
    JOIN products p ON s.product_id = p.id
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN invoices i ON s.invoice_id = i.id
  `;

  getAll(): SaleWithDetails[] {
    return this.queryAll(`${this.selectWithDetails} ORDER BY s.sale_date DESC`).map(this.mapRowWithDetails);
  }

  getByTruck(truckId: string): SaleWithDetails[] {
    return this.queryAll(
      `${this.selectWithDetails} WHERE s.truck_id = ? ORDER BY s.sale_date DESC`,
      [truckId]
    ).map(this.mapRowWithDetails);
  }

  getByCustomer(customerId: string): SaleWithDetails[] {
    return this.queryAll(
      `${this.selectWithDetails} WHERE s.customer_id = ? ORDER BY s.sale_date DESC`,
      [customerId]
    ).map(this.mapRowWithDetails);
  }

  getUnassigned(): SaleWithDetails[] {
    return this.queryAll(
      `${this.selectWithDetails} WHERE s.customer_id IS NULL ORDER BY s.sale_date DESC`
    ).map(this.mapRowWithDetails);
  }

  getUninvoiced(customerId?: string): SaleWithDetails[] {
    if (customerId) {
      return this.queryAll(
        `${this.selectWithDetails} WHERE s.invoice_id IS NULL AND s.customer_id = ? ORDER BY s.sale_date DESC`,
        [customerId]
      ).map(this.mapRowWithDetails);
    }
    return this.queryAll(
      `${this.selectWithDetails} WHERE s.invoice_id IS NULL ORDER BY s.sale_date DESC`
    ).map(this.mapRowWithDetails);
  }

  getById(id: string): SaleWithDetails | null {
    const row = this.queryOne(`${this.selectWithDetails} WHERE s.id = ?`, [id]);
    return row ? this.mapRowWithDetails(row) : null;
  }

  create(dto: CreateSaleDto): Sale {
    const id = uuidv4();
    const now = this.now();
    const totalPrice = dto.quantity * dto.unitPrice;

    this.execute(
      `INSERT INTO sales (id, truck_id, product_id, customer_id, unit_type, quantity, unit_price, total_price, sale_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dto.truckId, dto.productId, dto.customerId ?? null,
       dto.unitType, dto.quantity, dto.unitPrice, totalPrice, now,
       dto.notes ?? null, now, now]
    );

    const row = this.queryOne('SELECT * FROM sales WHERE id = ?', [id]);
    return this.mapRow(row);
  }

  update(id: string, dto: UpdateSaleDto): Sale | null {
    const row = this.queryOne('SELECT * FROM sales WHERE id = ?', [id]);
    if (!row) return null;

    const quantity = dto.quantity ?? row.quantity;
    const unitPrice = dto.unitPrice ?? row.unit_price;
    const totalPrice = quantity * unitPrice;
    const now = this.now();

    this.execute(
      `UPDATE sales SET customer_id = ?, unit_type = ?, quantity = ?, unit_price = ?, total_price = ?, notes = ?, updated_at = ? WHERE id = ?`,
      [
        dto.customerId !== undefined ? dto.customerId : row.customer_id,
        dto.unitType ?? row.unit_type,
        quantity, unitPrice, totalPrice,
        dto.notes !== undefined ? dto.notes : row.notes,
        now, id,
      ]
    );

    const updated = this.queryOne('SELECT * FROM sales WHERE id = ?', [id]);
    return this.mapRow(updated);
  }

  assignCustomer(saleIds: string[], customerId: string): number {
    const now = this.now();
    for (const saleId of saleIds) {
      this.execute(
        'UPDATE sales SET customer_id = ?, updated_at = ? WHERE id = ?',
        [customerId, now, saleId]
      );
    }
    return saleIds.length;
  }

  linkToInvoice(saleIds: string[], invoiceId: string): number {
    const now = this.now();
    for (const saleId of saleIds) {
      this.execute(
        'UPDATE sales SET invoice_id = ?, updated_at = ? WHERE id = ?',
        [invoiceId, now, saleId]
      );
    }
    return saleIds.length;
  }

  delete(id: string): boolean {
    this.execute('DELETE FROM sales WHERE id = ?', [id]);
    return this.changes() > 0;
  }

  private mapRow(row: any): Sale {
    return {
      id: row.id,
      truckId: row.truck_id,
      productId: row.product_id,
      customerId: row.customer_id,
      invoiceId: row.invoice_id,
      unitType: row.unit_type as UnitType,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      totalPrice: row.total_price,
      saleDate: row.sale_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowWithDetails(row: any): SaleWithDetails {
    return {
      id: row.id,
      truckId: row.truck_id,
      productId: row.product_id,
      customerId: row.customer_id,
      invoiceId: row.invoice_id,
      unitType: row.unit_type as UnitType,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      totalPrice: row.total_price,
      saleDate: row.sale_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      truckPlateNumber: row.truck_plate_number,
      productName: row.product_name,
      customerName: row.customer_name,
      invoiceNumber: row.invoice_number,
    };
  }
}
