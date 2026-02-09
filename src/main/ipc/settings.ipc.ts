import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { SettingsRepository } from '../repositories/settings.repository';

export function registerSettingsIpc(): void {
  const repo = new SettingsRepository();

  ipcMain.handle(IpcChannels.SETTINGS_GET, (_, key: string) => repo.get(key));
  ipcMain.handle(IpcChannels.SETTINGS_SET, (_, key: string, value: string) => {
    repo.set(key, value);
    return true;
  });
  ipcMain.handle(IpcChannels.SETTINGS_GET_ALL, () => repo.getAll());
}
