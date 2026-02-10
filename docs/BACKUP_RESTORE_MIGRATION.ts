/**
 * BACKUP, RESTORE & MIGRATION STRATEGY
 * ====================================
 * Ensure data integrity, business continuity, and safe database evolution
 */

// ============================================================================
// 1. BACKUP STRATEGY
// ============================================================================

/**
BACKUP TYPES & SCENARIOS
────────────────────────

1. MANUAL BACKUP
   - Trigger: User clicks [Backup Now] in Settings
   - Location: ~/Documents/OnurLtd-Backups/ (user-selectable)
   - File naming: OnurLtd_backup_YYYYMMDD_HHMMSS.sqlite3
   - Includes: Full SQLite database file (single file, easy to restore)
   - Size: Varies (typically 5-50 MB for small-to-medium business)
   - Retention: User keeps as many as desired; optional pruning advice

2. AUTOMATIC SCHEDULED BACKUP
   - Trigger: Daily at user-configured time (default: 2 AM)
   - Frequency: Configurable (daily, weekly, after N transactions)
   - Location: Same as above
   - Naming: OnurLtd_auto_YYYYMMDD.sqlite3
   - Retention policy: Keep last 7 backups (configurable); auto-delete older
   - If disk space low: delete oldest first, warn user

3. ENCRYPTED BACKUP (Optional, Premium)
   - Trigger: Manual backup with "Encrypt" checkbox
   - Method: ZIP + AES-256 encryption (password-protected)
   - File: OnurLtd_backup_YYYYMMDD_encrypted.zip
   - Password: User-provided, 12+ chars, stored in secure OS vault
   - Use case: Remote backup, client sharing, compliance requirements

4. CLOUD BACKUP (Future / Optional)
   - Trigger: Manual "Upload to Cloud" button
   - Destination: User's cloud storage (Google Drive, OneDrive, S3)
   - Method: Encrypted before upload, user controls key
   - Scheduling: Optional auto-sync when online
   - Note: Add in Phase 2 after offline-first is mature

BACKUP WORKFLOW
───────────────
1. [UI] User clicks [Settings] → [Backup] → [Backup Now]
   or Backup happens automatically at scheduled time
2. [SERVICE] backup.service.createBackup():
   a. Get current DB file path
   b. Copy DB file to backup directory with timestamp
   c. Verify integrity: open backup, run "PRAGMA integrity_check"
   d. Record backup metadata: {timestamp, size, path, hash}
   e. Store metadata in a local backups.json for UI display
3. [RESPONSE] Show success: "Backup complete - saved to ~/Documents/OnurLtd-Backups"
   with file size and restore link
4. [LOG] Audit log: BACKUP created by whom, where, size

BACKUP METADATA FILE (~/.onurltd/backups.json)
───────────────────────────────────────────
{
  "backups": [
    {
      "id": "uuid",
      "timestamp": "2026-02-15T02:00:00Z",
      "filename": "OnurLtd_backup_20260215_020000.sqlite3",
      "path": "/Users/user/Documents/OnurLtd-Backups/...",
      "sizeBytes": 2500000,
      "hash": "sha256:abc123...",
      "encrypted": false,
      "version": "1.2.3",
      "dbVersion": 4,
      "notes": "Scheduled backup"
    },
    ...
  ],
  "lastBackupAt": "2026-02-15T02:00:00Z",
  "autoBackupEnabled": true,
  "autoBackupHour": 2,
  "retentionDays": 30
}
*/

// ============================================================================
// 2. RESTORE STRATEGY
// ============================================================================

/**
RESTORE WORKFLOW
────────────────
1. [UI] User clicks [Settings] → [Backup] → [Restore from Backup]
   Shows list of available backups with timestamps, sizes, versions

2. [USER ACTION] Select backup, click [Preview]
   [SERVICE] backup.service.previewRestore(backupPath):
   a. Open backup file (read-only)
   b. Check schema version: SELECT MAX(version) FROM _migrations
   c. List entities: COUNT(*) FROM each major table
   d. Show summary:
      - DB version: 004
      - Created: 2026-02-15 02:00 AM
      - Contains: 152 invoices, 45 customers, 1200 sales
      - Size: 2.5 MB
   e. Warnings (if any):
      - "This backup is from v1.1.0; current is v1.2.3 (compatible)"
      - "This is older than your current DB (will lose recent data)"

3. [USER ACTION] Click [Restore] with confirmation:
   "WARNING: This will replace your current database.
    Recent changes since this backup will be lost.
    Create a backup of current DB first? [Yes] [No] [Cancel]"

4. [IF YES] Create a pre-restore backup (labeled "pre-restore-..."):
   a. Copy current DB to pre-restore file
   b. Record in backups.json

5. [RESTORATION PROCESS]:
   a. Close all active transactions
   b. Stop IPC handlers temporarily
   c. Rename current DB: db.sqlite3 → db.sqlite3.old
   d. Copy backup file to db.sqlite3
   e. Verify: open restored DB, run integrity check
   f. Run migrations to current version (if backup is older)
   g. Restart IPC handlers
   h. Reload UI data caches (customer, product lists)

6. [RESPONSE] Success message with:
   - "Database restored successfully"
   - "You are now running from backup dated 2026-02-15"
   - Action: [View Pre-Restore Backup] (in case user wants to undo)
   - App automatically restarts if major version change

7. [LOGGING] Audit log: RESTORE event with source backup, who triggered, when

RESTORE SAFETY CHECKS
─────────────────────
- Hash verification: backup SHA256 matches recorded hash
- Schema compatibility: ensure target DB version ≤ current app version
- Integrity check: PRAGMA integrity_check; returns 'ok'
- Post-restore validation: count(*) matches preview counts
- If any check fails: reject restore, suggest manual recovery
*/

// ============================================================================
// 3. MIGRATION STRATEGY
// ============================================================================

/**
MIGRATION ARCHITECTURE
──────────────────────

Goal: Enable safe, incremental database schema evolution without data loss.

MIGRATION FILES (sequential numbering)
- Location: src/main/database/migrations/
- Format: 00N_description.ts
- Each file exports: up(db: SqlJsDatabase) and down(db: SqlJsDatabase)
- Examples:
  • 001_initial.ts → create base tables (trucks, products, customers, sales)
  • 002_extended_invoicing.ts → add invoice, payment, line_items tables
  • 003_audit_and_sequences.ts → add audit_logs, invoice_sequences
  • 004_enhanced_entities.ts → add customer_merges, stock_transactions
  • 005_stock_management.ts → (future) full stock module

MIGRATION EXECUTION
───────────────────
1. [APP STARTUP] main/index.ts calls database.runMigrations()
2. [MIGRATION RUNNER] in migrations/index.ts:
   a. Create _migrations table if not exists
   b. Query: SELECT MAX(version) FROM _migrations
   c. Determine currentVersion and list pending migrations
   d. For each pending migration:
      - Call migration.up(db)
      - Log: INSERT INTO _migrations (version, name, applied_at)
   e. Log summary: "Migrations 2-4 applied successfully (3 new tables)"
   f. Save DB to disk (if using sql.js)

_MIGRATIONS TABLE
─────────────────
CREATE TABLE _migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

Example rows:
version | name                  | applied_at
--------|----------------------|────────────────────────
1       | initial_schema        | 2025-12-01 10:00:00
2       | extended_invoicing    | 2025-12-15 10:00:00
3       | audit_and_sequences   | 2026-01-10 10:00:00
4       | enhanced_entities     | 2026-02-08 10:00:00

MIGRATION BEST PRACTICES
────────────────────────

1. BACKWARD COMPATIBILITY
   - Use CREATE TABLE IF NOT EXISTS (no errors if already exists)
   - Add new columns with DEFAULT values or NULL
   - Avoid dropping columns or tables
   - If column removal needed: mark as DEPRECATED in comments, remove 2 releases later

2. ATOMICITY & ROLLBACK
   - Wrap multi-step migrations in explicit transaction if possible
   - sql.js note: doesn't fully support BEGIN/COMMIT, so ensure each SQL statement is idempotent
   - Always provide `down()` function for local testing; production rollback is manual

3. DATA PRESERVATION
   - Example: Adding NOT NULL column to existing table
     * Step 1: ALTER TABLE table_name ADD COLUMN new_col TEXT;
     * Step 2: UPDATE table_name SET new_col = 'default' WHERE new_col IS NULL;
     * Step 3: Can convert to NOT NULL in later migration if desired

4. INDICES & PERFORMANCE
   - Add indices for frequently queried columns (FK references, WHERE clauses)
   - Index naming: idx_{table}_{column(s)} (e.g., idx_invoices_customer_id)
   - Defer non-critical indices to separate migration if large dataset

5. TESTING MIGRATIONS
   - Before release: run migration on test DB with sample data
   - Verify counts before/after: SELECT COUNT(*) per table
   - Restore from backup before migration; verify restore then migrate
   - Document expected data changes in migration comment

MIGRATION EXAMPLE (004_enhanced_entities.ts)
─────────────────────────────────────────────
export function up(db: SqlJsDatabase): void {
  // Create invoice_line_items (if not exists)
  db.run(`
    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      sale_id TEXT,
      sequence_number INTEGER NOT NULL,
      ...
    );
  `);

  // Create indices
  db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);`);
  // (Idempotent: index creation doesn't fail if already exists)
}

export function down(db: SqlJsDatabase): void {
  // For testing/development only; production rollback is manual
  db.run(`DROP TABLE IF EXISTS invoice_line_items;`);
}

HANDLING MIGRATION FAILURES
────────────────────────────
- If migration crashes mid-execution:
  1. App detects inconsistency on next startup
  2. Show error dialog: "Database state invalid. Restore from backup?"
  3. Options: [Restore] [Ignore & Continue (risky)] [View Details]
  4. If [Restore]: activate restore flow (see Restore Strategy above)
  5. If [Continue]: log error, let app run (customers should backup regularly)

VERSION HANDLING
────────────────
- App tracks: current code version (package.json) + DB schema version (_migrations)
- On startup:
  * If code version < DB version: warn "Cannot downgrade database"
  * If code version > DB version: run pending migrations
  * If code version == DB version: all good
  * Version mismatch detected: show modal with upgrade/downgrade options
*/

// ============================================================================
// 4. TRANSACTION SAFETY
// ============================================================================

/**
TRANSACTION BOUNDARIES (ACID Compliance)
─────────────────────────────────────────

1. INVOICE CREATION FROM SALES
   Atomicity: All-or-nothing
   - INSERT invoice (status=DRAFT)
   - INSERT invoice_line_items (one per sale)
   - UPDATE sales SET invoiceId = ?
   - UPDATE invoice_number_sequences
   - INSERT audit_log records
   ⇒ Wrap in transaction: BEGIN → ... → COMMIT/ROLLBACK

2. RECORD PAYMENT
   - INSERT payment
   - Compute total paid from sum(payments)
   - UPDATE invoice (status, paymentReceivedDate if >= totalAmount)
   - INSERT audit_log
   ⇒ Single transaction

3. MERGE CUSTOMER
   - INSERT customer_merges
   - UPDATE sales.customerId (source → target)
   - UPDATE invoices.customerId
   - UPDATE source_customer.isActive = false
   - INSERT multiple audit_log entries
   ⇒ Single transaction

4. RESTORE FROM BACKUP
   - Check integrity before/after
   - Verify metadata consistency
   - Not a DB transaction per se, but a file-level operation with rollback (old DB preserved)

TRANSACTION ISOLATION (sql.js note)
───────────────────────────────────
- sql.js is in-memory, single-threaded → built-in isolation
- Electron main process: single-threaded IPC serialization → natural serialization of writes
- Recommendation: Always batch related operations into single service call
- Never interleave IPC calls expecting atomicity across calls
*/

// ============================================================================
// 5. OPERATIONAL PROCEDURES
// ============================================================================

/**
ADMIN CHECKLIST: NEW DEPLOYMENT
────────────────────────────────
1. [ ] Back up current DB: Settings → Backup Now
2. [ ] Test restore from backup on test machine
3. [ ] Review migration changelog (what's new in schema)
4. [ ] Deploy new app version
5. [ ] On first launch, app runs pending migrations automatically
6. [ ] Verify: Dashboard loads, sample queries work
7. [ ] Check audit log: should show migration entries
8. [ ] Keep pre-upgrade backup for 2 weeks minimum

ADMIN CHECKLIST: DISASTER RECOVERY
──────────────────────────────────
1. [ ] Identify latest good backup
2. [ ] Create new backup of current (broken) state for investigation
3. [ ] Restore from good backup
4. [ ] Verify data: counts, key entities
5. [ ] Document incident: what went wrong, when, outcome
6. [ ] If data loss: notify affected customers (invoices, payments)
7. [ ] Update backup strategy if needed (more frequent backups?)

CUSTOMER COMMUNICATION
──────────────────────
- Recommend: Create backup weekly or after heavy transaction day
- Recommended location: Dropbox, Google Drive, USB drive (off-device)
- Disaster recovery time: < 5 minutes (restore + verification)
- Data loss risk: Minimized via automated backups + user education
*/

export const backupRestoreMigrationDocumentation = 'See detailed strategy above';

