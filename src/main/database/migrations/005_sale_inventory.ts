import { Database as SqlJsDatabase } from 'sql.js';

/**
 * Migration 005: Sale payment status & truck inventory
 * - Add payment_status and paid_amount to sales
 * - Create truck_inventory table to track products in trucks
 * - Support multiple products per truck
 */

export function up(db: SqlJsDatabase): void {
  // Add payment status and paid amount to sales table
  db.run(`
    ALTER TABLE sales 
    ADD COLUMN payment_status TEXT DEFAULT 'UNPAID';
  `);

  db.run(`
    ALTER TABLE sales 
    ADD COLUMN paid_amount REAL DEFAULT 0;
  `);

  db.run(`
    ALTER TABLE sales 
    ADD COLUMN auto_invoice BOOLEAN DEFAULT 0;
  `);

  // Create truck_inventory table to track products in trucks
  db.run(`
    CREATE TABLE IF NOT EXISTS truck_inventory (
      id TEXT PRIMARY KEY,
      truck_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (truck_id) REFERENCES trucks(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(truck_id, product_id)
    );
  `);

  // Create indices for performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_truck_inventory_truck ON truck_inventory(truck_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_truck_inventory_product ON truck_inventory(product_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);`);
}

export function down(db: SqlJsDatabase): void {
  db.run(`DROP TABLE IF EXISTS truck_inventory;`);
  db.run(`ALTER TABLE sales DROP COLUMN IF EXISTS payment_status;`);
  db.run(`ALTER TABLE sales DROP COLUMN IF EXISTS paid_amount;`);
  db.run(`ALTER TABLE sales DROP COLUMN IF EXISTS auto_invoice;`);
}
