import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { ProductService } from '../services/product.service';

export function registerProductIpc(): void {
  const service = new ProductService();

  ipcMain.handle(IpcChannels.PRODUCT_GET_ALL, () => service.getAll());
  ipcMain.handle(IpcChannels.PRODUCT_GET_ACTIVE, () => service.getActive());
  ipcMain.handle(IpcChannels.PRODUCT_GET_BY_ID, (_, id: string) => service.getById(id));
  ipcMain.handle(IpcChannels.PRODUCT_CREATE, (_, dto) => service.create(dto));
  ipcMain.handle(IpcChannels.PRODUCT_UPDATE, (_, id: string, dto) => service.update(id, dto));
  ipcMain.handle(IpcChannels.PRODUCT_DELETE, (_, id: string) => service.delete(id));
}
