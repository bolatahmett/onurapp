import { Database as SqlJsDatabase } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import { saveDatabase } from './connection';
import crypto from 'crypto';
import { DEFAULT_LANGUAGE, DEFAULT_BACKUP_INTERVAL_HOURS, DEFAULT_MAX_BACKUPS } from '../../shared/constants';

export function seedDatabase(db: SqlJsDatabase): void {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM settings');
  let count = 0;
  if (stmt.step()) {
    count = (stmt.getAsObject().count as number) ?? 0;
  }
  stmt.free();

  // if (count > 0) {
  //   return; // Already seeded
  // }

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

  // Seed Admin user
  const adminStmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "ADMIN"');
  let adminCount = 0;
  if (adminStmt.step()) {
    adminCount = (adminStmt.getAsObject().count as number) ?? 0;
  }
  adminStmt.free();

  if (adminCount === 0) {
    // Determine the path to AuthService relatively or just use direct SQL for seeding to avoid circular deps or complexity
    // But since AuthService is available and we want to use the hashing logic, let's use it if possible.
    // However, AuthService uses getDatabase() which might be tricky during seed/init.
    // So let's duplicate the hash logic slightly or simple direct insert if we want to be safe, 
    // BUT AuthService is cleaner. We can just instantiate AuthService if we want, or use static method

    // Actually, I'll just use crypto here to avoid dependency cycle if any
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('admin123', salt, 1000, 64, 'sha512').toString('hex');
    const now = new Date().toISOString();

    db.run(`
      INSERT INTO users (
        id, username, password_hash, salt, role, 
        first_name, last_name, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      'admin',
      hash,
      salt,
      'ADMIN',
      'System',
      'Admin',
      1,
      now,
      now
    ]);
  }

  saveDatabase();
}
