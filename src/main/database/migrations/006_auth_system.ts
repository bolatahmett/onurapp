import { Database as SqlJsDatabase } from 'sql.js';

/**
 * Migration 006: Authentication System
 * - Create users table
 * - Create sessions table
 */

export function up(db: SqlJsDatabase): void {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      first_name TEXT,
      last_name TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT
    );
  `);

  // Create sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indices
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);`);
}

export function down(db: SqlJsDatabase): void {
  db.run(`DROP TABLE IF EXISTS sessions;`);
  db.run(`DROP TABLE IF EXISTS users;`);
}
