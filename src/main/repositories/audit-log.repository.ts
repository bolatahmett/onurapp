import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection';
import { AuditLog } from '../../shared/types/entities';

/**
 * @deprecated Use AuditService instead. This repository is kept for backward compatibility
 * but now maps to the new audit_logs schema.
 */
export class AuditLogRepository {
  create(
    entityType: string,
    entityId: string,
    action: string,
    oldValues: any | null = null,
    newValues: any | null = null,
    userId: string | null = null
  ): AuditLog {
    const db = getDatabase();
    const id = uuidv4();
    const details = JSON.stringify({ oldValues, newValues });

    db.run(
      `INSERT INTO audit_logs (id, entity_type, entity_id, action, user_id, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, entityType, entityId, action, userId, details]
    );

    return {
      id,
      entityType,
      entityId,
      action,
      userId,
      details,
      createdAt: new Date().toISOString(),
    };
  }

  log(
    entityType: string,
    entityId: string,
    action: string,
    oldValues: any | null = null,
    newValues: any | null = null,
    userId: string | null = null
  ): AuditLog {
    return this.create(entityType, entityId, action, oldValues, newValues, userId);
  }

  getById(id: string): AuditLog | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM audit_logs WHERE id = ?');
    stmt.bind([id]);

    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.getAsObject() as any;
    stmt.free();

    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      userId: row.user_id,
      details: row.details,
      createdAt: row.created_at,
    };
  }

  getByEntity(entityType: string, entityId: string): AuditLog[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC'
    );
    stmt.bind([entityType, entityId]);

    const logs: AuditLog[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      logs.push({
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        userId: row.user_id,
        details: row.details,
        createdAt: row.created_at,
      });
    }
    stmt.free();
    return logs;
  }

  getRecent(limit: number = 100): AuditLog[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?'
    );
    stmt.bind([limit]);

    const logs: AuditLog[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      logs.push({
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        userId: row.user_id,
        details: row.details,
        createdAt: row.created_at,
      });
    }
    stmt.free();
    return logs;
  }

  deleteOlderThan(days: number): number {
    const db = getDatabase();
    const thresholdDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    db.run(`DELETE FROM audit_logs WHERE created_at < ?`, [thresholdDate]);
    return db.getRowsModified();
  }
}
