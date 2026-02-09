import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import { Product, CreateProductDto, UpdateProductDto } from '../../shared/types/entities';
import { UnitType } from '../../shared/types/enums';

export class ProductRepository extends BaseRepository {
  getAll(): Product[] {
    return this.queryAll('SELECT * FROM products ORDER BY name ASC').map(this.mapRow);
  }

  getActive(): Product[] {
    return this.queryAll('SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC').map(this.mapRow);
  }

  getById(id: string): Product | null {
    const row = this.queryOne('SELECT * FROM products WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  create(dto: CreateProductDto): Product {
    const id = uuidv4();
    const now = this.now();
    this.execute(
      `INSERT INTO products (id, name, variety, default_unit_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, dto.name, dto.variety ?? null, dto.defaultUnitType, now, now]
    );
    return this.getById(id)!;
  }

  update(id: string, dto: UpdateProductDto): Product | null {
    const product = this.getById(id);
    if (!product) return null;
    const now = this.now();
    this.execute(
      `UPDATE products SET name = ?, variety = ?, default_unit_type = ?, is_active = ?, updated_at = ? WHERE id = ?`,
      [
        dto.name ?? product.name,
        dto.variety !== undefined ? dto.variety : product.variety,
        dto.defaultUnitType ?? product.defaultUnitType,
        dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : (product.isActive ? 1 : 0),
        now, id,
      ]
    );
    return this.getById(id);
  }

  delete(id: string): boolean {
    this.execute('DELETE FROM products WHERE id = ?', [id]);
    return this.changes() > 0;
  }

  private mapRow(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      variety: row.variety,
      defaultUnitType: row.default_unit_type as UnitType,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
