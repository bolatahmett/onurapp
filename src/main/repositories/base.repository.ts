import { Database as SqlJsDatabase } from 'sql.js';
import { getDatabase } from '../database/connection';
import { saveDatabase } from '../database/connection';

export abstract class BaseRepository {
  protected get db(): SqlJsDatabase {
    return getDatabase();
  }

  protected now(): string {
    return new Date().toISOString();
  }

  protected queryAll(sql: string, params: any[] = []): any[] {
    const stmt = this.db.prepare(sql);
    if (params.length) stmt.bind(params);

    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  protected queryOne(sql: string, params: any[] = []): any | null {
    const stmt = this.db.prepare(sql);
    if (params.length) stmt.bind(params);

    let result: any = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  }

  protected execute(sql: string, params: any[] = []): void {
    this.db.run(sql, params);
    saveDatabase();
  }

  protected changes(): number {
    const result = this.queryOne('SELECT changes() as changes');
    return result?.changes ?? 0;
  }
}
