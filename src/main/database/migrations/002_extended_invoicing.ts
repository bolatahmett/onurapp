import { Database as SqlJsDatabase } from 'sql.js';

/**
 * Migration 002: Extended Invoicing System
 * - Add discount support to sales
 * - Enhance customer entity for better management
 * - Enhance product entity with SKU and categorization
 * - Enhance invoice for payment tracking
 * - Create invoice_line_items for historical accuracy
 * - Add customer customer_merges table for consolidation tracking
 * - Add payments table for partial payment support
 */

export function up(db: SqlJsDatabase): void {
  // Add discount fields to sales table
  db.run(`
    ALTER TABLE sales ADD COLUMN discount_type TEXT DEFAULT 'FIXED';
  `);
  db.run(`
    ALTER TABLE sales ADD COLUMN discount_amount REAL DEFAULT 0;
  `);
  db.run(`
    ALTER TABLE sales ADD COLUMN discount_reason TEXT;
  `);
  db.run(`
    ALTER TABLE sales ADD COLUMN seller_name TEXT;
  `);
  db.run(`
    ALTER TABLE sales ADD COLUMN payment_method TEXT;
  `);

  // Enhance customers table
  db.run(`
    ALTER TABLE customers ADD COLUMN email TEXT;
  `);
  db.run(`
    ALTER TABLE customers ADD COLUMN tax_number TEXT;
  `);
  db.run(`
    ALTER TABLE customers ADD COLUMN contact_person TEXT;
  `);
  db.run(`
    ALTER TABLE customers ADD COLUMN credit_limit REAL;
  `);
  db.run(`
    ALTER TABLE customers ADD COLUMN payment_terms TEXT;
  `);
  db.run(`
    ALTER TABLE customers ADD COLUMN merged_from_id TEXT;
  `);
  db.run(`
    ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'RETAIL';
  `);

  // Enhance products table
  db.run(`
    ALTER TABLE products ADD COLUMN code TEXT;
  `);
  db.run(`
    ALTER TABLE products ADD COLUMN category TEXT;
  `);
  db.run(`
    ALTER TABLE products ADD COLUMN base_price REAL;
  `);

  // Enhance invoices table for payment tracking
  db.run(`
    ALTER TABLE invoices ADD COLUMN subtotal REAL DEFAULT 0;
  `);
  db.run(`
    ALTER TABLE invoices ADD COLUMN tax_amount REAL DEFAULT 0;
  `);
  db.run(`
    ALTER TABLE invoices ADD COLUMN tax_rate REAL DEFAULT 0;
  `);
  db.run(`
    ALTER TABLE invoices ADD COLUMN net_total REAL DEFAULT 0;
  `);
  db.run(`
    ALTER TABLE invoices ADD COLUMN payment_received_date TEXT;
  `);
  db.run(`
    ALTER TABLE invoices ADD COLUMN payment_method TEXT;
  `);
  db.run(`
    ALTER TABLE invoices ADD COLUMN payment_notes TEXT;
  `);
  db.run(`
    ALTER TABLE invoices ADD COLUMN issued_by_user_id TEXT;
  `);
  db.run(`
    ALTER TABLE invoices ADD COLUMN paid_by_user_id TEXT;
  `);
  db.run(`
    ALTER TABLE invoices ADD COLUMN cancelled_by_user_id TEXT;
  `);
  db.run(`
    ALTER TABLE invoices ADD COLUMN cancellation_reason TEXT;
  `);

  // Create invoice_line_items table (normalized invoice details)
  db.run(`
    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      sale_id TEXT,
      sequence_number INTEGER,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount_type TEXT,
      discount_amount REAL DEFAULT 0,
      line_total REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );
  `);

  // Create payments table (for partial/installment payment support)
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

  // Create customer_merges table (track consolidation history)
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

  // Create indices for performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_sales_discount_type ON sales(discount_type);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_payment_method ON invoices(payment_method);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_issued_by ON invoices(issued_by_user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customers_merged_from ON customers(merged_from_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_line_items_sale ON invoice_line_items(sale_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_merges_source ON customer_merges(source_customer_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_merges_target ON customer_merges(target_customer_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`);
}

export function down(db: SqlJsDatabase): void {
  // Drop new tables
  db.run(`DROP TABLE IF EXISTS invoice_line_items;`);
  db.run(`DROP TABLE IF EXISTS payments;`);
  db.run(`DROP TABLE IF EXISTS customer_merges;`);

  // Remove columns from existing tables
  // Note: SQLite doesn't support ALTER TABLE DROP COLUMN easily
  // For a true rollback, you'd need to recreate tables
  // This is a simplified version - in production, use more robust migration
}
