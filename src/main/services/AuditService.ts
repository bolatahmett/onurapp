import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from '../database/connection';
import { AuditLog } from '../../shared/types/entities';

export class AuditService {
    private static instance: AuditService;

    private constructor() { }

    public static getInstance(): AuditService {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }

    private get db() {
        return getDatabase();
    }

    public log(
        entityType: string,
        entityId: string,
        action: string,
        userId: string | null,
        details: string | null = null
    ): void {
        try {
            const id = uuidv4();
            const params = [
                id,
                entityType,
                entityId,
                action,
                userId,
                details
            ];

            this.db.run(
                `INSERT INTO audit_logs (id, entity_type, entity_id, action, user_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
                params
            );

            // We don't necessarily need to saveDatabase() on every log if high volume, 
            // but for financial integrity it's safer.
            saveDatabase();
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw, we don't want to break the main transaction if logging fails?
            // Or maybe we do for strict auditing. Let's log to console for now.
        }
    }

    public getLogs(
        entityType?: string,
        entityId?: string,
        limit: number = 100,
        offset: number = 0
    ): AuditLog[] {
        let query = `
      SELECT 
        a.*,
        u.username as username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (entityType) {
            query += ` AND a.entity_type = ?`;
            params.push(entityType);
        }

        if (entityId) {
            query += ` AND a.entity_id = ?`;
            params.push(entityId);
        }

        query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const stmt = this.db.prepare(query);
        stmt.bind(params);

        const logs: AuditLog[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            logs.push({
                id: row.id as string,
                entityType: row.entity_type as string,
                entityId: row.entity_id as string,
                action: row.action as string,
                userId: row.user_id as string | null,
                details: row.details as string | null,
                createdAt: row.created_at as string,
                // We could extend AuditLog to include username if needed for UI, 
                // but base entity matches table structure.
            });
        }
        stmt.free();
        return logs;
    }
}

export const auditService = AuditService.getInstance();
