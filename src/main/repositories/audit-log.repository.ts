import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection';
import { AuditLog } from '../../shared/types/entities';
import { AuditAction } from '../../shared/types/enums';

export class AuditLogRepository {
  create(
    entityType: string,
    entityId: string,
    action: AuditAction,
    oldValues: any | null = null,
    newValues: any | null = null,
    userId: string | null = null
  ): AuditLog {
    const db = getDatabase();
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const oldValuesJson = oldValues ? JSON.stringify(oldValues) : null;
    const newValuesJson = newValues ? JSON.stringify(newValues) : null;

    db.run(
      `INSERT INTO audit_logs (id, entity_type, entity_id, action, old_values, new_values, user_id, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, entityType, entityId, action, oldValuesJson, newValuesJson, userId, timestamp]
    );

    return this.getById(id)!;
  }

  log(
    entityType: string,
    entityId: string,
    action: AuditAction,
    oldValues: any | null = null,
    newValues: any | null = null,
    userId: string | null = null
  ): AuditLog {
    // Alias for create() to match service calling convention
    return this.create(entityType, entityId, action, oldValues, newValues, userId);
  }

  getById(id: string): AuditLog | null {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, entity_type as entityType, entity_id as entityId, action, old_values as oldValues, 
              new_values as newValues, user_id as userId, timestamp
       FROM audit_logs WHERE id = ?`
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
      entityType: row.entityType,
      entityId: row.entityId,
      action: row.action as AuditAction,
      oldValues: row.oldValues,
      newValues: row.newValues,
      userId: row.userId,
      timestamp: row.timestamp,
    };
  }

  getByEntity(entityType: string, entityId: string): AuditLog[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, entity_type as entityType, entity_id as entityId, action, old_values as oldValues,
              new_values as newValues, user_id as userId, timestamp
       FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY timestamp DESC`
    );
    stmt.bind([entityType, entityId]);

    const logs: AuditLog[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      logs.push({
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
        action: row.action as AuditAction,
        oldValues: row.oldValues,
        newValues: row.newValues,
        userId: row.userId,
        timestamp: row.timestamp,
      });
    }
    stmt.free();

    return logs;
  }

  getByAction(action: AuditAction, days: number = 30): AuditLog[] {
    const db = getDatabase();
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const stmt = db.prepare(
      `SELECT id, entity_type as entityType, entity_id as entityId, action, old_values as oldValues,
              new_values as newValues, user_id as userId, timestamp
       FROM audit_logs WHERE action = ? AND timestamp >= ? ORDER BY timestamp DESC`
    );
    stmt.bind([action, sinceDate]);

    const logs: AuditLog[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      logs.push({
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
        action: row.action as AuditAction,
        oldValues: row.oldValues,
        newValues: row.newValues,
        userId: row.userId,
        timestamp: row.timestamp,
      });
    }
    stmt.free();

    return logs;
  }

  getRecent(limit: number = 100): AuditLog[] {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT id, entity_type as entityType, entity_id as entityId, action, old_values as oldValues,
              new_values as newValues, user_id as userId, timestamp
       FROM audit_logs ORDER BY timestamp DESC LIMIT ?`
    );
    stmt.bind([limit]);

    const logs: AuditLog[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      logs.push({
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
        action: row.action as AuditAction,
        oldValues: row.oldValues,
        newValues: row.newValues,
        userId: row.userId,
        timestamp: row.timestamp,
      });
    }
    stmt.free();

    return logs;
  }

  deleteOlderThan(days: number): number {
    const db = getDatabase();
    const thresholdDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    db.run(`DELETE FROM audit_logs WHERE timestamp < ?`, [thresholdDate]);
    return db.getRowsModified();
  }
}
