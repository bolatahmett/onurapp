import { Database as SqlJsDatabase } from 'sql.js';

/**
 * Migration 004: Enhanced entities & relationships
 * - Ensure all invoice-related tables exist with proper relationships
 * - Create customer_merges table for tracking customer consolidations
 * - Add stock_transactions table (optional for future stock management)
 * - Ensure backward compatibility with existing schema
 */

export function up(db: SqlJsDatabase): void {
  // Ensure invoice_line_items table exists (may have been created in 002)
  db.run(`
    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      sale_id TEXT,
      sequence_number INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount_type TEXT DEFAULT 'NONE',
      discount_amount REAL DEFAULT 0,
      line_total REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );
  `);

  // Ensure payments table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_date TEXT NOT NULL,
      method TEXT,
      notes TEXT,
      reference TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );
  `);

  // Create customer_merges table for tracking consolidations
  db.run(`
    CREATE TABLE IF NOT EXISTS customer_merges (
      id TEXT PRIMARY KEY,
      source_customer_id TEXT NOT NULL,
      target_customer_id TEXT NOT NULL,
      merged_at TEXT NOT NULL DEFAULT (datetime('now')),
      merged_by_user_id TEXT,
      FOREIGN KEY (source_customer_id) REFERENCES customers(id),
      FOREIGN KEY (target_customer_id) REFERENCES customers(id)
    );
  `);

  // Create stock_transactions table (for optional stock management)
  db.run(`
    CREATE TABLE IF NOT EXISTS stock_transactions (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      delta REAL NOT NULL,
      reason TEXT NOT NULL,
      reference_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Create indices for performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_line_items_sale ON invoice_line_items(sale_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_merges_source ON customer_merges(source_customer_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_merges_target ON customer_merges(target_customer_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stock_transactions_product ON stock_transactions(product_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stock_transactions_created ON stock_transactions(created_at);`);
}

export function down(db: SqlJsDatabase): void {
  db.run(`DROP TABLE IF EXISTS stock_transactions;`);
  db.run(`DROP TABLE IF EXISTS customer_merges;`);
  db.run(`DROP TABLE IF EXISTS payments;`);
  db.run(`DROP TABLE IF EXISTS invoice_line_items;`);
}

