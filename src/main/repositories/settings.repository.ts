import { BaseRepository } from './base.repository';
import { Setting } from '../../shared/types/entities';

export class SettingsRepository extends BaseRepository {
  get(key: string): string | null {
    const row = this.queryOne('SELECT value FROM settings WHERE key = ?', [key]);
    return row?.value ?? null;
  }

  set(key: string, value: string): void {
    this.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }

  getAll(): Setting[] {
    return this.queryAll('SELECT * FROM settings');
  }
}
