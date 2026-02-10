import { Database as SqlJsDatabase } from 'sql.js';
import { up as migration001 } from './001_initial';
import { up as migration002 } from './002_extended_invoicing';
import { up as migration003 } from './003_audit_and_sequences';
import { up as migration004 } from './004_enhanced_entities';
import { saveDatabase } from '../connection';

interface Migration {
  version: number;
  name: string;
  up: (db: SqlJsDatabase) => void;
}

const migrations: Migration[] = [
  { version: 1, name: 'initial_schema', up: migration001 },
  { version: 2, name: 'extended_invoicing', up: migration002 },
  { version: 3, name: 'audit_and_sequences', up: migration003 },
  { version: 4, name: 'enhanced_entities', up: migration004 },
];

export function runMigrations(db: SqlJsDatabase): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const stmt = db.prepare('SELECT MAX(version) as version FROM _migrations');
  let currentVersion = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    currentVersion = (row.version as number) ?? 0;
  }
  stmt.free();

  const pendingMigrations = migrations.filter(
    (m) => m.version > currentVersion
  );

  if (pendingMigrations.length === 0) {
    return;
  }

  for (const migration of pendingMigrations) {
    migration.up(db);
    db.run('INSERT INTO _migrations (version, name) VALUES (?, ?)', [
      migration.version,
      migration.name,
    ]);
  }

  saveDatabase();
}
