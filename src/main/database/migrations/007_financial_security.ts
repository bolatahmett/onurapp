import { Database as SqlJsDatabase } from 'sql.js';

/**
 * Migration 007: Financial Security & Audit
 * - Create audit_logs table
 * - Add deleted_at column to main entities for soft delete
 * - Add is_locked column to invoices
 */

export function up(db: SqlJsDatabase): void {
    // Create audit_logs table
    db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
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

    // Add deleted_at to entities
    const tables = ['users', 'customers', 'products', 'trucks', 'sales', 'invoices', 'payments'];

    for (const table of tables) {
        try {
            db.run(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT;`);
        } catch (e) {
            // Column might already exist, ignore error or log it
            console.log(`Column deleted_at might already exist in ${table}`);
        }
    }

    // Add is_locked to invoices
    try {
        db.run(`ALTER TABLE invoices ADD COLUMN is_locked BOOLEAN DEFAULT 0;`);
    } catch (e) {
        console.log(`Column is_locked might already exist in invoices`);
    }

    // Indices for audit performance
    try {
        db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);`);
        // created_at index will be created by migration 008 if schema is updated
        db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`);
    } catch (e) {
        // Index on created_at may fail if old schema; migration 008 will fix
        console.log('Some audit indices may not have been created (expected if old schema):', e);
    }
}

export function down(db: SqlJsDatabase): void {
    db.run(`DROP TABLE IF EXISTS audit_logs;`);
    // Cannot easily drop columns in SQLite
}
