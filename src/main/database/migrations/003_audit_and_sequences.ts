import { Database as SqlJsDatabase } from 'sql.js';

/**
 * Migration 003: Audit Logging and Invoice Numbering
 * - Create audit_logs table for comprehensive change tracking
 * - Create invoice_number_sequences table for sequential invoice numbering
 * - Add indices for audit log queries
 */

export function up(db: SqlJsDatabase): void {
  // Create audit_logs table (track all entity changes)
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      user_id TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create invoice_number_sequences table (ensure unique invoice numbers)
  db.run(`
    CREATE TABLE IF NOT EXISTS invoice_number_sequences (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      last_sequence INTEGER NOT NULL DEFAULT 0,
      UNIQUE(year, month)
    );
  `);

  // Create indices for audit logs
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`);

  // Create indices for invoice sequences
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_sequences_year_month ON invoice_number_sequences(year, month);`);
}

export function down(db: SqlJsDatabase): void {
  // Drop new tables
  db.run(`DROP TABLE IF EXISTS audit_logs;`);
  db.run(`DROP TABLE IF EXISTS invoice_number_sequences;`);
}
