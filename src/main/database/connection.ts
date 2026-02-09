import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { DB_NAME } from '../../shared/constants';

let db: SqlJsDatabase | null = null;
let dbPath: string = '';
let saveTimer: ReturnType<typeof setInterval> | null = null;

export function getDbPath(): string {
  if (!dbPath) {
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, DB_NAME);
  }
  return dbPath;
}

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(): Promise<SqlJsDatabase> {
  // Locate WASM file
  let wasmBinary: ArrayBuffer | undefined;
  const possiblePaths = [
    // Packaged app
    path.join(process.resourcesPath || '', 'sql-wasm.wasm'),
    // Development - from node_modules
    path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    // Development - from project root
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const buf = fs.readFileSync(p);
      wasmBinary = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      break;
    }
  }

  const SQL = await initSqlJs({
    wasmBinary,
  });

  const filePath = getDbPath();

  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Auto-save periodically
  startAutoSave();

  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(getDbPath(), buffer);
}

function startAutoSave(): void {
  if (saveTimer) clearInterval(saveTimer);
  saveTimer = setInterval(() => {
    saveDatabase();
  }, 5000);
}

export function closeDatabase(): void {
  if (saveTimer) {
    clearInterval(saveTimer);
    saveTimer = null;
  }
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}
