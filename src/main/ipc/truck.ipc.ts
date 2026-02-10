import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { TruckService } from '../services/truck.service';
import { TruckInventoryService } from '../domain/services/truck-inventory.service';
import { TruckInventoryRepository } from '../repositories/truck-inventory.repository';
import { SaleRepository } from '../repositories/sale.repository';
import { saveDatabase } from '../database/connection';

export function registerTruckIpc(): void {
  const service = new TruckService();

  // Truck Inventory
  const inventoryRepo = new TruckInventoryRepository();
  const saleRepo = new SaleRepository();
  const inventoryService = new TruckInventoryService(inventoryRepo, saleRepo);

  ipcMain.handle(IpcChannels.TRUCK_GET_ALL, () => service.getAll());
  ipcMain.handle(IpcChannels.TRUCK_GET_ACTIVE, () => service.getActive());
  ipcMain.handle(IpcChannels.TRUCK_GET_BY_ID, (_, id: string) => service.getById(id));
  
  ipcMain.handle(IpcChannels.TRUCK_CREATE, (_, dto) => {
    const truck = service.create(dto);
    saveDatabase();
    return truck;
  });
  
  ipcMain.handle(IpcChannels.TRUCK_UPDATE, (_, id: string, dto) => {
    const truck = service.update(id, dto);
    saveDatabase();
    return truck;
  });
  
  ipcMain.handle(IpcChannels.TRUCK_CLOSE, (_, id: string) => {
    const truck = service.close(id);
    // Clear inventory when truck is closed
    inventoryService.clearTruckInventory(id);
    saveDatabase();
    return truck;
  });
  
  ipcMain.handle(IpcChannels.TRUCK_DELETE, (_, id: string) => {
    const result = service.delete(id);
    saveDatabase();
    return result;
  });

  // Truck Inventory Handlers
  ipcMain.handle(IpcChannels.TRUCK_INVENTORY_GET, (_, truckId: string) => 
    inventoryService.getTruckInventory(truckId)
  );

  ipcMain.handle(IpcChannels.TRUCK_INVENTORY_ADD, (_, truckId: string, dto) => {
    try {
      const inventory = inventoryService.addProduct(truckId, dto);
      saveDatabase();
      return { success: true, data: inventory };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.TRUCK_INVENTORY_UPDATE, (_, truckId: string, productId: string, quantity: number) => {
    try {
      const inventory = inventoryService.updateQuantity(truckId, productId, quantity);
      saveDatabase();
      return { success: true, data: inventory };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.TRUCK_INVENTORY_DELETE, (_, truckId: string, productId: string) => {
    try {
      const success = inventoryService.removeProduct(truckId, productId);
      saveDatabase();
      return { success };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.TRUCK_INVENTORY_GET_REMAINING, (_, truckId: string, productId: string) => {
    const remaining = inventoryService.getRemainingQuantity(truckId, productId);
    return { remaining };
  });

  ipcMain.handle(IpcChannels.TRUCK_INVENTORY_CLEAR, (_, truckId: string) => {
    try {
      const count = inventoryService.clearTruckInventory(truckId);
      saveDatabase();
      return { success: true, cleared: count };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
