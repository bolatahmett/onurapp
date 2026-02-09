import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { TruckService } from '../services/truck.service';

export function registerTruckIpc(): void {
  const service = new TruckService();

  ipcMain.handle(IpcChannels.TRUCK_GET_ALL, () => service.getAll());
  ipcMain.handle(IpcChannels.TRUCK_GET_ACTIVE, () => service.getActive());
  ipcMain.handle(IpcChannels.TRUCK_GET_BY_ID, (_, id: string) => service.getById(id));
  ipcMain.handle(IpcChannels.TRUCK_CREATE, (_, dto) => service.create(dto));
  ipcMain.handle(IpcChannels.TRUCK_UPDATE, (_, id: string, dto) => service.update(id, dto));
  ipcMain.handle(IpcChannels.TRUCK_CLOSE, (_, id: string) => service.close(id));
  ipcMain.handle(IpcChannels.TRUCK_DELETE, (_, id: string) => service.delete(id));
}
