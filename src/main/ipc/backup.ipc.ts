import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { BackupService } from '../services/backup.service';
import { SettingsRepository } from '../repositories/settings.repository';
import { BackupType } from '../../shared/types/enums';

export function registerBackupIpc(): void {
  const service = new BackupService();
  const settingsRepo = new SettingsRepository();

  ipcMain.handle(IpcChannels.BACKUP_CREATE, () => {
    return service.createBackup(BackupType.MANUAL);
  });

  ipcMain.handle(IpcChannels.BACKUP_RESTORE, (_, filePath: string) => {
    return service.restoreFromBackup(filePath);
  });

  ipcMain.handle(IpcChannels.BACKUP_GET_LOGS, () => {
    return service.getLogs();
  });

  ipcMain.handle(IpcChannels.BACKUP_GET_SETTINGS, () => {
    return {
      autoBackupEnabled: settingsRepo.get('auto_backup_enabled') === 'true',
      backupIntervalHours: parseInt(settingsRepo.get('backup_interval_hours') ?? '6', 10),
      maxBackups: parseInt(settingsRepo.get('max_backups') ?? '10', 10),
      backupDirectory: service.getBackupDirectory(),
    };
  });

  ipcMain.handle(IpcChannels.BACKUP_UPDATE_SETTINGS, (_, settings: any) => {
    if (settings.autoBackupEnabled !== undefined) {
      settingsRepo.set('auto_backup_enabled', String(settings.autoBackupEnabled));
    }
    if (settings.backupIntervalHours !== undefined) {
      settingsRepo.set('backup_interval_hours', String(settings.backupIntervalHours));
    }
    if (settings.maxBackups !== undefined) {
      settingsRepo.set('max_backups', String(settings.maxBackups));
    }
    if (settings.backupDirectory !== undefined) {
      settingsRepo.set('backup_directory', settings.backupDirectory);
    }

    // Restart auto backup with new settings
    service.startAutoBackup();
    return true;
  });

  ipcMain.handle(IpcChannels.BACKUP_SELECT_FILE, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'Database', extensions: ['db'] }],
      properties: ['openFile'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle(IpcChannels.BACKUP_SELECT_DIRECTORY, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Start auto backup on registration
  service.startAutoBackup();
}
