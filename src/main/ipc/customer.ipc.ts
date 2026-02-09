import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { CustomerService } from '../services/customer.service';
import { MergeCustomerDto } from '../../shared/types/entities';
import { saveDatabase } from '../database/connection';
import { CustomerType } from '../../shared/types/enums';

export function registerCustomerIpc(): void {
  const service = new CustomerService();

  ipcMain.handle(IpcChannels.CUSTOMER_GET_ALL, () => service.getAll());
  
  ipcMain.handle(IpcChannels.CUSTOMER_GET_ACTIVE, () => service.getActive());
  
  ipcMain.handle(IpcChannels.CUSTOMER_GET_TEMPORARY, () => service.getTemporary());
  
  ipcMain.handle(IpcChannels.CUSTOMER_GET_BY_ID, (_, id: string) => service.getById(id));
  
  ipcMain.handle(IpcChannels.CUSTOMER_CREATE, (_, dto) => {
    try {
      const customer = service.create(dto);
      saveDatabase();
      return { success: true, data: customer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle(IpcChannels.CUSTOMER_UPDATE, (_, id: string, dto) => {
    try {
      const customer = service.update(id, dto);
      saveDatabase();
      return { success: true, data: customer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle(IpcChannels.CUSTOMER_DELETE, (_, id: string) => {
    try {
      const success = service.delete(id);
      saveDatabase();
      return { success };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_MERGE, (_, dto: MergeCustomerDto) => {
    try {
      const customer = service.merge(dto);
      saveDatabase();
      return { success: true, data: customer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_GET_HISTORY, (_, customerId: string) => {
    try {
      const history = service.getHistory(customerId);
      return { success: true, data: history };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
