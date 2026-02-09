import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection';
import { CustomerMerge } from '../../shared/types/entities';

export class CustomerMergeRepository {
  create(sourceCustomerId: string, targetCustomerId: string, mergedByUserId?: string): CustomerMerge {
    const db = getDatabase();
    const id = uuidv4();
    const mergedAt = new Date().toISOString();

    db.run(
      `INSERT INTO customer_merges (id, source_customer_id, target_customer_id, merged_at, merged_by_user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [id, sourceCustomerId, targetCustomerId, mergedAt, mergedByUserId || null]
    );

    return this.getById(id)!;
  }

  getById(id: string): CustomerMerge | null {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, source_customer_id as sourceCustomerId, target_customer_id as targetCustomerId,
              merged_at as mergedAt, merged_by_user_id as mergedByUserId
       FROM customer_merges WHERE id = ?`
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
      sourceCustomerId: row.sourceCustomerId,
      targetCustomerId: row.targetCustomerId,
      mergedAt: row.mergedAt,
      mergedByUserId: row.mergedByUserId,
    };
  }

  getBySourceCustomerId(sourceCustomerId: string): CustomerMerge[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, source_customer_id as sourceCustomerId, target_customer_id as targetCustomerId,
              merged_at as mergedAt, merged_by_user_id as mergedByUserId
       FROM customer_merges WHERE source_customer_id = ? ORDER BY merged_at DESC`
    );
    stmt.bind([sourceCustomerId]);

    const merges: CustomerMerge[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      merges.push({
        id: row.id,
        sourceCustomerId: row.sourceCustomerId,
        targetCustomerId: row.targetCustomerId,
        mergedAt: row.mergedAt,
        mergedByUserId: row.mergedByUserId,
      });
    }
    stmt.free();

    return merges;
  }

  getByTargetCustomerId(targetCustomerId: string): CustomerMerge[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, source_customer_id as sourceCustomerId, target_customer_id as targetCustomerId,
              merged_at as mergedAt, merged_by_user_id as mergedByUserId
       FROM customer_merges WHERE target_customer_id = ? ORDER BY merged_at DESC`
    );
    stmt.bind([targetCustomerId]);

    const merges: CustomerMerge[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      merges.push({
        id: row.id,
        sourceCustomerId: row.sourceCustomerId,
        targetCustomerId: row.targetCustomerId,
        mergedAt: row.mergedAt,
        mergedByUserId: row.mergedByUserId,
      });
    }
    stmt.free();

    return merges;
  }

  getAll(): CustomerMerge[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, source_customer_id as sourceCustomerId, target_customer_id as targetCustomerId,
              merged_at as mergedAt, merged_by_user_id as mergedByUserId
       FROM customer_merges ORDER BY merged_at DESC`
    );

    const merges: CustomerMerge[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      merges.push({
        id: row.id,
        sourceCustomerId: row.sourceCustomerId,
        targetCustomerId: row.targetCustomerId,
        mergedAt: row.mergedAt,
        mergedByUserId: row.mergedByUserId,
      });
    }
    stmt.free();

    return merges;
  }

  delete(id: string): boolean {
    const db = getDatabase();
    db.run(`DELETE FROM customer_merges WHERE id = ?`, [id]);
    return true;
  }
}
