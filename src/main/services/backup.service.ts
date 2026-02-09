import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getDatabase, getDbPath, closeDatabase, initDatabase, saveDatabase } from '../database/connection';
import { SettingsRepository } from '../repositories/settings.repository';
import { BackupLog } from '../../shared/types/entities';
import { BackupType } from '../../shared/types/enums';
import { BACKUP_DIR_NAME } from '../../shared/constants';

export class BackupService {
  private settingsRepo = new SettingsRepository();
  private backupTimer: ReturnType<typeof setInterval> | null = null;

  getBackupDirectory(): string {
    const custom = this.settingsRepo.get('backup_directory');
    if (custom) return custom;
    return path.join(app.getPath('userData'), BACKUP_DIR_NAME);
  }

  createBackup(type: BackupType, targetDir?: string): BackupLog {
    const db = getDatabase();
    const dir = targetDir || this.getBackupDirectory();

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `onurltd_backup_${timestamp}.db`;
    const filePath = path.join(dir, fileName);

    // Export database to file
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(filePath, buffer);

    const stats = fs.statSync(filePath);

    // Log the backup
    const id = uuidv4();
    db.run(
      'INSERT INTO backup_logs (id, file_path, type, size_bytes) VALUES (?, ?, ?, ?)',
      [id, filePath, type, stats.size]
    );
    saveDatabase();

    this.cleanOldBackups(dir);

    return {
      id,
      filePath,
      type,
      sizeBytes: stats.size,
      createdAt: new Date().toISOString(),
    };
  }

  async restoreFromBackup(backupPath: string): Promise<boolean> {
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }

    const dbFilePath = getDbPath();

    // Close current database
    closeDatabase();

    // Rename current DB as safety net
    const safetyPath = dbFilePath + '.pre-restore';
    if (fs.existsSync(dbFilePath)) {
      fs.copyFileSync(dbFilePath, safetyPath);
    }

    // Copy backup as active DB
    fs.copyFileSync(backupPath, dbFilePath);

    // Re-open database
    await initDatabase();

    return true;
  }

  getLogs(): BackupLog[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM backup_logs ORDER BY created_at DESC');
    const results: BackupLog[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      results.push({
        id: row.id,
        filePath: row.file_path,
        type: row.type as BackupType,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
      });
    }
    stmt.free();
    return results;
  }

  startAutoBackup(): void {
    this.stopAutoBackup();

    const enabled = this.settingsRepo.get('auto_backup_enabled');
    if (enabled !== 'true') return;

    const hours = parseInt(this.settingsRepo.get('backup_interval_hours') ?? '6', 10);
    const intervalMs = hours * 60 * 60 * 1000;

    this.backupTimer = setInterval(() => {
      try {
        this.createBackup(BackupType.AUTOMATIC);
      } catch (err) {
        console.error('Auto backup failed:', err);
      }
    }, intervalMs);
  }

  stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }

  private cleanOldBackups(dir: string): void {
    const maxBackups = parseInt(this.settingsRepo.get('max_backups') ?? '10', 10);

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('onurltd_backup_') && f.endsWith('.db'))
      .map((f) => ({
        name: f,
        path: path.join(dir, f),
        time: fs.statSync(path.join(dir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxBackups) {
      const toDelete = files.slice(maxBackups);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
      }
    }
  }
}
