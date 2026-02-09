import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { SaleService } from '../services/sale.service';

export function registerSaleIpc(): void {
  const service = new SaleService();

  ipcMain.handle(IpcChannels.SALE_GET_ALL, () => service.getAll());
  ipcMain.handle(IpcChannels.SALE_GET_BY_TRUCK, (_, truckId: string) => service.getByTruck(truckId));
  ipcMain.handle(IpcChannels.SALE_GET_BY_CUSTOMER, (_, customerId: string) => service.getByCustomer(customerId));
  ipcMain.handle(IpcChannels.SALE_GET_UNASSIGNED, () => service.getUnassigned());
  ipcMain.handle(IpcChannels.SALE_GET_UNINVOICED, (_, customerId?: string) => service.getUninvoiced(customerId));
  ipcMain.handle(IpcChannels.SALE_GET_BY_ID, (_, id: string) => service.getById(id));
  ipcMain.handle(IpcChannels.SALE_CREATE, (_, dto) => service.create(dto));
  ipcMain.handle(IpcChannels.SALE_UPDATE, (_, id: string, dto) => service.update(id, dto));
  ipcMain.handle(IpcChannels.SALE_ASSIGN_CUSTOMER, (_, saleIds: string[], customerId: string) =>
    service.assignCustomer(saleIds, customerId)
  );
  ipcMain.handle(IpcChannels.SALE_DELETE, (_, id: string) => service.delete(id));
}
