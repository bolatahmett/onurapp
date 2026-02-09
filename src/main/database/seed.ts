import { Database as SqlJsDatabase } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import { saveDatabase } from './connection';
import { DEFAULT_LANGUAGE, DEFAULT_BACKUP_INTERVAL_HOURS, DEFAULT_MAX_BACKUPS } from '../../shared/constants';

export function seedDatabase(db: SqlJsDatabase): void {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM settings');
  let count = 0;
  if (stmt.step()) {
    count = (stmt.getAsObject().count as number) ?? 0;
  }
  stmt.free();

  if (count > 0) {
    return; // Already seeded
  }

  // Default settings
  const settings = [
    ['language', DEFAULT_LANGUAGE],
    ['backup_interval_hours', String(DEFAULT_BACKUP_INTERVAL_HOURS)],
    ['max_backups', String(DEFAULT_MAX_BACKUPS)],
    ['backup_directory', ''],
    ['auto_backup_enabled', 'true'],
    ['schema_version', '1'],
  ];

  for (const [key, value] of settings) {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }

  // Common fruit products
  const fruits = [
    { name: 'Elma', variety: null, unitType: 'CRATE' },
    { name: 'Portakal', variety: null, unitType: 'CRATE' },
    { name: 'Mandalina', variety: null, unitType: 'CRATE' },
    { name: 'Limon', variety: null, unitType: 'CRATE' },
    { name: 'Üzüm', variety: null, unitType: 'CRATE' },
    { name: 'Domates', variety: null, unitType: 'CRATE' },
    { name: 'Biber', variety: null, unitType: 'CRATE' },
    { name: 'Muz', variety: null, unitType: 'CRATE' },
    { name: 'Çilek', variety: null, unitType: 'CRATE' },
    { name: 'Karpuz', variety: null, unitType: 'PALLET' },
    { name: 'Kavun', variety: null, unitType: 'PALLET' },
    { name: 'Armut', variety: null, unitType: 'CRATE' },
    { name: 'Kiraz', variety: null, unitType: 'CRATE' },
    { name: 'Şeftali', variety: null, unitType: 'CRATE' },
    { name: 'Kayısı', variety: null, unitType: 'CRATE' },
    { name: 'Erik', variety: null, unitType: 'CRATE' },
    { name: 'Nar', variety: null, unitType: 'CRATE' },
    { name: 'İncir', variety: null, unitType: 'CRATE' },
  ];

  for (const fruit of fruits) {
    db.run(
      'INSERT OR IGNORE INTO products (id, name, variety, default_unit_type) VALUES (?, ?, ?, ?)',
      [uuidv4(), fruit.name, fruit.variety, fruit.unitType]
    );
  }

  saveDatabase();
}
