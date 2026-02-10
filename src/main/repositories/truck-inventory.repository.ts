import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection';
import { TruckInventory, CreateTruckInventoryDto, UpdateTruckInventoryDto } from '../../shared/types/entities';

export class TruckInventoryRepository {
  create(truckId: string, dto: CreateTruckInventoryDto): TruckInventory {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO truck_inventory (id, truck_id, product_id, quantity, unit_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, truckId, dto.productId, dto.quantity, dto.unitType, now, now]
    );

    return this.getById(id)!;
  }

  getById(id: string): TruckInventory | null {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, truck_id as truckId, product_id as productId, quantity, unit_type as unitType, created_at as createdAt, updated_at as updatedAt
       FROM truck_inventory WHERE id = ?`
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
      truckId: row.truckId,
      productId: row.productId,
      quantity: row.quantity,
      unitType: row.unitType,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  getByTruck(truckId: string): TruckInventory[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, truck_id as truckId, product_id as productId, quantity, unit_type as unitType, created_at as createdAt, updated_at as updatedAt
       FROM truck_inventory WHERE truck_id = ? ORDER BY created_at`
    );
    stmt.bind([truckId]);

    const items: TruckInventory[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      items.push({
        id: row.id,
        truckId: row.truckId,
        productId: row.productId,
        quantity: row.quantity,
        unitType: row.unitType,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }
    stmt.free();

    return items;
  }

  getByTruckAndProduct(truckId: string, productId: string): TruckInventory | null {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, truck_id as truckId, product_id as productId, quantity, unit_type as unitType, created_at as createdAt, updated_at as updatedAt
       FROM truck_inventory WHERE truck_id = ? AND product_id = ?`
    );
    stmt.bind([truckId, productId]);

    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.getAsObject() as any;
    stmt.free();

    return {
      id: row.id,
      truckId: row.truckId,
      productId: row.productId,
      quantity: row.quantity,
      unitType: row.unitType,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  update(id: string, dto: UpdateTruckInventoryDto): TruckInventory | null {
    const current = this.getById(id);
    if (!current) return null;

    const db = getDatabase();
    const now = new Date().toISOString();

    const quantity = dto.quantity !== undefined ? dto.quantity : current.quantity;
    const unitType = dto.unitType || current.unitType;

    db.run(
      `UPDATE truck_inventory SET quantity = ?, unit_type = ?, updated_at = ? WHERE id = ?`,
      [quantity, unitType, now, id]
    );

    return this.getById(id);
  }

  updateQuantity(truckId: string, productId: string, newQuantity: number): TruckInventory | null {
    const current = this.getByTruckAndProduct(truckId, productId);
    if (!current) return null;

    const db = getDatabase();
    const now = new Date().toISOString();

    db.run(
      `UPDATE truck_inventory SET quantity = ?, updated_at = ? WHERE truck_id = ? AND product_id = ?`,
      [newQuantity, now, truckId, productId]
    );

    return this.getByTruckAndProduct(truckId, productId);
  }

  delete(id: string): boolean {
    const db = getDatabase();
    db.run(`DELETE FROM truck_inventory WHERE id = ?`, [id]);
    return true;
  }

  deleteByTruck(truckId: string): number {
    const db = getDatabase();
    db.run(`DELETE FROM truck_inventory WHERE truck_id = ?`, [truckId]);
    return db.getRowsModified();
  }

  getAll(): TruckInventory[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, truck_id as truckId, product_id as productId, quantity, unit_type as unitType, created_at as createdAt, updated_at as updatedAt
       FROM truck_inventory ORDER BY created_at DESC`
    );

    const items: TruckInventory[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      items.push({
        id: row.id,
        truckId: row.truckId,
        productId: row.productId,
        quantity: row.quantity,
        unitType: row.unitType,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }
    stmt.free();

    return items;
  }
}
