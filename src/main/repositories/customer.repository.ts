import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../../shared/types/entities';
import { CustomerType } from '../../shared/types/enums';

export class CustomerRepository extends BaseRepository {
  getAll(): Customer[] {
    return this.queryAll('SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY name ASC').map(this.mapRow);
  }

  getActive(): Customer[] {
    return this.queryAll('SELECT * FROM customers WHERE is_active = 1 AND deleted_at IS NULL ORDER BY name ASC').map(this.mapRow);
  }

  getTemporary(): Customer[] {
    return this.queryAll('SELECT * FROM customers WHERE is_temporary = 1 AND is_active = 1 AND deleted_at IS NULL ORDER BY name ASC').map(
      this.mapRow
    );
  }

  getById(id: string): Customer | null {
    const row = this.queryOne('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL', [id]);
    return row ? this.mapRow(row) : null;
  }

  getByCustomerType(customerType: CustomerType): Customer[] {
    return this.queryAll('SELECT * FROM customers WHERE customer_type = ? AND deleted_at IS NULL ORDER BY name ASC', [customerType]).map(
      this.mapRow
    );
  }

  create(dto: CreateCustomerDto): Customer {
    const id = uuidv4();
    const now = this.now();
    this.execute(
      `INSERT INTO customers (id, name, phone, address, email, tax_id, tax_number, contact_person, 
                              credit_limit, payment_terms, customer_type, is_temporary, is_active, merged_from_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.name,
        dto.phone ?? null,
        dto.address ?? null,
        dto.email ?? null,
        dto.taxId ?? null,
        dto.taxNumber ?? null,
        dto.contactPerson ?? null,
        dto.creditLimit ?? null,
        dto.paymentTerms ?? null,
        dto.customerType ?? CustomerType.RETAIL,
        dto.isTemporary ? 1 : 0,
        1, // is_active
        null, // merged_from_id
        now,
        now,
      ]
    );
    return this.getById(id)!;
  }

  update(id: string, dto: UpdateCustomerDto): Customer | null {
    const customer = this.getById(id);
    if (!customer) return null;
    const now = this.now();
    this.execute(
      `UPDATE customers SET 
        name = ?, phone = ?, address = ?, email = ?, tax_id = ?, tax_number = ?, 
        contact_person = ?, credit_limit = ?, payment_terms = ?, customer_type = ?, 
        is_temporary = ?, is_active = ?, updated_at = ? 
       WHERE id = ?`,
      [
        dto.name ?? customer.name,
        dto.phone !== undefined ? dto.phone : customer.phone,
        dto.address !== undefined ? dto.address : customer.address,
        dto.email !== undefined ? dto.email : customer.email,
        dto.taxId !== undefined ? dto.taxId : customer.taxId,
        dto.taxNumber !== undefined ? dto.taxNumber : customer.taxNumber,
        dto.contactPerson !== undefined ? dto.contactPerson : customer.contactPerson,
        dto.creditLimit !== undefined ? dto.creditLimit : customer.creditLimit,
        dto.paymentTerms !== undefined ? dto.paymentTerms : customer.paymentTerms,
        dto.customerType !== undefined ? dto.customerType : customer.customerType,
        dto.isTemporary !== undefined ? (dto.isTemporary ? 1 : 0) : (customer.isTemporary ? 1 : 0),
        dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : (customer.isActive ? 1 : 0),
        now,
        id,
      ]
    );
    return this.getById(id);
  }

  delete(id: string): boolean {
    const now = this.now();
    this.execute('UPDATE customers SET deleted_at = ? WHERE id = ?', [now, id]);
    return this.changes() > 0;
  }

  private mapRow(row: any): Customer {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      address: row.address,
      email: row.email,
      taxId: row.tax_id,
      taxNumber: row.tax_number,
      contactPerson: row.contact_person,
      creditLimit: row.credit_limit,
      paymentTerms: row.payment_terms,
      customerType: row.customer_type || CustomerType.RETAIL,
      mergedFromId: row.merged_from_id,
      isTemporary: row.is_temporary === 1,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }
}
