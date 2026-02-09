import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { InvoiceService } from '../services/invoice.service';

export function registerInvoiceIpc(): void {
  const service = new InvoiceService();

  ipcMain.handle(IpcChannels.INVOICE_GET_ALL, () => service.getAll());
  ipcMain.handle(IpcChannels.INVOICE_GET_BY_ID, (_, id: string) => service.getById(id));
  ipcMain.handle(IpcChannels.INVOICE_CREATE, (_, dto) => service.create(dto));
  ipcMain.handle(IpcChannels.INVOICE_UPDATE, (_, id: string, dto) => service.update(id, dto));
  ipcMain.handle(IpcChannels.INVOICE_DELETE, (_, id: string) => service.delete(id));
}
