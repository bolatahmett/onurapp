import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/types/ipc';

const api = {
  // Truck
  truck: {
    getAll: () => ipcRenderer.invoke(IpcChannels.TRUCK_GET_ALL),
    getActive: () => ipcRenderer.invoke(IpcChannels.TRUCK_GET_ACTIVE),
    getById: (id: string) => ipcRenderer.invoke(IpcChannels.TRUCK_GET_BY_ID, id),
    create: (dto: any) => ipcRenderer.invoke(IpcChannels.TRUCK_CREATE, dto),
    update: (id: string, dto: any) => ipcRenderer.invoke(IpcChannels.TRUCK_UPDATE, id, dto),
    close: (id: string) => ipcRenderer.invoke(IpcChannels.TRUCK_CLOSE, id),
    delete: (id: string) => ipcRenderer.invoke(IpcChannels.TRUCK_DELETE, id),
  },

  // Product
  product: {
    getAll: () => ipcRenderer.invoke(IpcChannels.PRODUCT_GET_ALL),
    getActive: () => ipcRenderer.invoke(IpcChannels.PRODUCT_GET_ACTIVE),
    getById: (id: string) => ipcRenderer.invoke(IpcChannels.PRODUCT_GET_BY_ID, id),
    create: (dto: any) => ipcRenderer.invoke(IpcChannels.PRODUCT_CREATE, dto),
    update: (id: string, dto: any) => ipcRenderer.invoke(IpcChannels.PRODUCT_UPDATE, id, dto),
    delete: (id: string) => ipcRenderer.invoke(IpcChannels.PRODUCT_DELETE, id),
  },

  // Customer
  customer: {
    getAll: () => ipcRenderer.invoke(IpcChannels.CUSTOMER_GET_ALL),
    getActive: () => ipcRenderer.invoke(IpcChannels.CUSTOMER_GET_ACTIVE),
    getById: (id: string) => ipcRenderer.invoke(IpcChannels.CUSTOMER_GET_BY_ID, id),
    create: (dto: any) => ipcRenderer.invoke(IpcChannels.CUSTOMER_CREATE, dto),
    update: (id: string, dto: any) => ipcRenderer.invoke(IpcChannels.CUSTOMER_UPDATE, id, dto),
    delete: (id: string) => ipcRenderer.invoke(IpcChannels.CUSTOMER_DELETE, id),
  },

  // Sale
  sale: {
    getAll: () => ipcRenderer.invoke(IpcChannels.SALE_GET_ALL),
    getByTruck: (truckId: string) => ipcRenderer.invoke(IpcChannels.SALE_GET_BY_TRUCK, truckId),
    getByCustomer: (customerId: string) =>
      ipcRenderer.invoke(IpcChannels.SALE_GET_BY_CUSTOMER, customerId),
    getUnassigned: () => ipcRenderer.invoke(IpcChannels.SALE_GET_UNASSIGNED),
    getUninvoiced: (customerId?: string) =>
      ipcRenderer.invoke(IpcChannels.SALE_GET_UNINVOICED, customerId),
    getById: (id: string) => ipcRenderer.invoke(IpcChannels.SALE_GET_BY_ID, id),
    create: (dto: any) => ipcRenderer.invoke(IpcChannels.SALE_CREATE, dto),
    update: (id: string, dto: any) => ipcRenderer.invoke(IpcChannels.SALE_UPDATE, id, dto),
    assignCustomer: (saleIds: string[], customerId: string) =>
      ipcRenderer.invoke(IpcChannels.SALE_ASSIGN_CUSTOMER, saleIds, customerId),
    delete: (id: string) => ipcRenderer.invoke(IpcChannels.SALE_DELETE, id),
  },

  // Invoice
  invoice: {
    getAll: () => ipcRenderer.invoke(IpcChannels.INVOICE_GET_ALL),
    getById: (id: string) => ipcRenderer.invoke(IpcChannels.INVOICE_GET_BY_ID, id),
    create: (dto: any) => ipcRenderer.invoke(IpcChannels.INVOICE_CREATE, dto),
    update: (id: string, dto: any) => ipcRenderer.invoke(IpcChannels.INVOICE_UPDATE, id, dto),
    delete: (id: string) => ipcRenderer.invoke(IpcChannels.INVOICE_DELETE, id),
  },

  // Report
  report: {
    dailySummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_DAILY_SUMMARY, startDate, endDate),
    productSummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_PRODUCT_SUMMARY, startDate, endDate),
    customerSummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_CUSTOMER_SUMMARY, startDate, endDate),
    truckSummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_TRUCK_SUMMARY, startDate, endDate),
    revenueByPeriod: (period: string, startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_REVENUE_BY_PERIOD, period, startDate, endDate),
  },

  // Backup
  backup: {
    create: () => ipcRenderer.invoke(IpcChannels.BACKUP_CREATE),
    restore: (filePath: string) => ipcRenderer.invoke(IpcChannels.BACKUP_RESTORE, filePath),
    getLogs: () => ipcRenderer.invoke(IpcChannels.BACKUP_GET_LOGS),
    getSettings: () => ipcRenderer.invoke(IpcChannels.BACKUP_GET_SETTINGS),
    updateSettings: (settings: any) =>
      ipcRenderer.invoke(IpcChannels.BACKUP_UPDATE_SETTINGS, settings),
    selectFile: () => ipcRenderer.invoke(IpcChannels.BACKUP_SELECT_FILE),
    selectDirectory: () => ipcRenderer.invoke(IpcChannels.BACKUP_SELECT_DIRECTORY),
  },

  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke(IpcChannels.SETTINGS_GET, key),
    set: (key: string, value: string) =>
      ipcRenderer.invoke(IpcChannels.SETTINGS_SET, key, value),
    getAll: () => ipcRenderer.invoke(IpcChannels.SETTINGS_GET_ALL),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronApi = typeof api;
