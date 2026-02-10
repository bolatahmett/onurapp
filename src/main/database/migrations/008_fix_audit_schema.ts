import { Database as SqlJsDatabase } from 'sql.js';

/**
 * Migration 008: Fix audit_logs schema
 * - Drop old audit_logs table if it has old schema (timestamp column)
 * - Recreate with new schema (created_at column)
 */

export function up(db: SqlJsDatabase): void {
    // Check if audit_logs has old schema by looking for 'timestamp' column
    try {
        const result = db.exec("PRAGMA table_info(audit_logs)");
        if (result.length > 0) {
            const columns = result[0].values.map((v: any) => v[1]);
            const hasTimestamp = columns.includes('timestamp');
            const hasCreatedAt = columns.includes('created_at');

            if (hasTimestamp && !hasCreatedAt) {
                // Old schema - drop and recreate
                db.run('DROP TABLE IF EXISTS audit_logs');
                db.run(`
          CREATE TABLE audit_logs (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            action TEXT NOT NULL,
            user_id TEXT,
            details TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
          );
        `);
                db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);`);
                db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);`);
                db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`);
            }
        }
    } catch (e) {
        console.log('Error fixing audit_logs schema:', e);
    }
}

export function down(db: SqlJsDatabase): void {
    // No rollback needed
}
