import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { CustomerService } from '../services/customer.service';

export function registerCustomerIpc(): void {
  const service = new CustomerService();

  ipcMain.handle(IpcChannels.CUSTOMER_GET_ALL, () => service.getAll());
  ipcMain.handle(IpcChannels.CUSTOMER_GET_ACTIVE, () => service.getActive());
  ipcMain.handle(IpcChannels.CUSTOMER_GET_BY_ID, (_, id: string) => service.getById(id));
  ipcMain.handle(IpcChannels.CUSTOMER_CREATE, (_, dto) => service.create(dto));
  ipcMain.handle(IpcChannels.CUSTOMER_UPDATE, (_, id: string, dto) => service.update(id, dto));
  ipcMain.handle(IpcChannels.CUSTOMER_DELETE, (_, id: string) => service.delete(id));
}
