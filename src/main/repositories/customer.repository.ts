import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../../shared/types/entities';

export class CustomerRepository extends BaseRepository {
  getAll(): Customer[] {
    return this.queryAll('SELECT * FROM customers ORDER BY name ASC').map(this.mapRow);
  }

  getActive(): Customer[] {
    return this.queryAll('SELECT * FROM customers WHERE is_active = 1 ORDER BY name ASC').map(this.mapRow);
  }

  getById(id: string): Customer | null {
    const row = this.queryOne('SELECT * FROM customers WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  create(dto: CreateCustomerDto): Customer {
    const id = uuidv4();
    const now = this.now();
    this.execute(
      `INSERT INTO customers (id, name, phone, address, tax_id, is_temporary, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dto.name, dto.phone ?? null, dto.address ?? null,
       dto.taxId ?? null, dto.isTemporary ? 1 : 0, now, now]
    );
    return this.getById(id)!;
  }

  update(id: string, dto: UpdateCustomerDto): Customer | null {
    const customer = this.getById(id);
    if (!customer) return null;
    const now = this.now();
    this.execute(
      `UPDATE customers SET name = ?, phone = ?, address = ?, tax_id = ?, is_temporary = ?, is_active = ?, updated_at = ? WHERE id = ?`,
      [
        dto.name ?? customer.name,
        dto.phone !== undefined ? dto.phone : customer.phone,
        dto.address !== undefined ? dto.address : customer.address,
        dto.taxId !== undefined ? dto.taxId : customer.taxId,
        dto.isTemporary !== undefined ? (dto.isTemporary ? 1 : 0) : (customer.isTemporary ? 1 : 0),
        dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : (customer.isActive ? 1 : 0),
        now, id,
      ]
    );
    return this.getById(id);
  }

  delete(id: string): boolean {
    this.execute('DELETE FROM customers WHERE id = ?', [id]);
    return this.changes() > 0;
  }

  private mapRow(row: any): Customer {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      address: row.address,
      taxId: row.tax_id,
      isTemporary: row.is_temporary === 1,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
