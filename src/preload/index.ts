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
    // Inventory Management
    getInventory: (truckId: string) => ipcRenderer.invoke(IpcChannels.TRUCK_INVENTORY_GET, truckId),
    addInventory: (truckId: string, dto: any) => ipcRenderer.invoke(IpcChannels.TRUCK_INVENTORY_ADD, truckId, dto),
    updateInventory: (truckId: string, productId: string, quantity: number) =>
      ipcRenderer.invoke(IpcChannels.TRUCK_INVENTORY_UPDATE, truckId, productId, quantity),
    deleteInventory: (truckId: string, productId: string) =>
      ipcRenderer.invoke(IpcChannels.TRUCK_INVENTORY_DELETE, truckId, productId),
    getRemainingQuantity: (truckId: string, productId: string) =>
      ipcRenderer.invoke(IpcChannels.TRUCK_INVENTORY_GET_REMAINING, truckId, productId),
    clearInventory: (truckId: string) => ipcRenderer.invoke(IpcChannels.TRUCK_INVENTORY_CLEAR, truckId),
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
    getTemporary: () => ipcRenderer.invoke(IpcChannels.CUSTOMER_GET_TEMPORARY),
    create: (dto: any) => ipcRenderer.invoke(IpcChannels.CUSTOMER_CREATE, dto),
    update: (id: string, dto: any) => ipcRenderer.invoke(IpcChannels.CUSTOMER_UPDATE, id, dto),
    delete: (id: string) => ipcRenderer.invoke(IpcChannels.CUSTOMER_DELETE, id),
    merge: (sourceId: string, targetId: string) =>
      ipcRenderer.invoke(IpcChannels.CUSTOMER_MERGE, sourceId, targetId),
    getHistory: (customerId: string) =>
      ipcRenderer.invoke(IpcChannels.CUSTOMER_GET_HISTORY, customerId),
    // Debt & Balance
    getSummary: (customerId: string) =>
      ipcRenderer.invoke(IpcChannels.CUSTOMER_GET_SUMMARY, customerId),
    getBalance: (customerId: string) =>
      ipcRenderer.invoke(IpcChannels.CUSTOMER_GET_BALANCE, customerId),
    getInvoiceStatuses: (customerId: string) =>
      ipcRenderer.invoke(IpcChannels.CUSTOMER_GET_INVOICE_STATUSES, customerId),
    getWithDebt: () =>
      ipcRenderer.invoke(IpcChannels.CUSTOMER_GET_WITH_DEBT),
    getOverCredit: () =>
      ipcRenderer.invoke(IpcChannels.CUSTOMER_GET_OVER_CREDIT),
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
    getByCustomer: (customerId: string) =>
      ipcRenderer.invoke(IpcChannels.INVOICE_GET_BY_CUSTOMER, customerId),
    create: (customerId: string, saleIds: string[], dto: any) =>
      ipcRenderer.invoke(IpcChannels.INVOICE_CREATE, customerId, saleIds, dto),
    update: (id: string, dto: any) => ipcRenderer.invoke(IpcChannels.INVOICE_UPDATE, id, dto),
    issue: (id: string) => ipcRenderer.invoke(IpcChannels.INVOICE_ISSUE, id),
    markPaid: (id: string, dto: any) => ipcRenderer.invoke(IpcChannels.INVOICE_MARK_PAID, id, dto),
    delete: (id: string) => ipcRenderer.invoke(IpcChannels.INVOICE_DELETE, id),
    exportPdf: (invoiceId: string) =>
      ipcRenderer.invoke(IpcChannels.EXPORT_INVOICE_PDF, invoiceId),
    // Payment status
    getPaymentSummary: (invoiceId: string) =>
      ipcRenderer.invoke(IpcChannels.INVOICE_GET_PAYMENT_SUMMARY, invoiceId),
    getCustomerWithPayments: (customerId: string) =>
      ipcRenderer.invoke(IpcChannels.INVOICE_GET_CUSTOMER_WITH_PAYMENTS, customerId),
    getOverdue: () =>
      ipcRenderer.invoke(IpcChannels.INVOICE_GET_OVERDUE),
    makePartialPayment: (invoiceId: string, amount: number, method: string, notes?: string) =>
      ipcRenderer.invoke(IpcChannels.INVOICE_MAKE_PARTIAL_PAYMENT, invoiceId, amount, method, notes),
  },

  // Payment
  payment: {
    create: (dto: any) => ipcRenderer.invoke(IpcChannels.PAYMENT_CREATE, dto),
    getByInvoice: (invoiceId: string) =>
      ipcRenderer.invoke(IpcChannels.PAYMENT_GET_BY_INVOICE, invoiceId),
    delete: (id: string) => ipcRenderer.invoke(IpcChannels.PAYMENT_DELETE, id),
    // Debt tracking
    getByCustomer: (customerId: string) =>
      ipcRenderer.invoke(IpcChannels.PAYMENT_GET_BY_CUSTOMER, customerId),
    getInvoiceDetail: (invoiceId: string) =>
      ipcRenderer.invoke(IpcChannels.PAYMENT_GET_INVOICE_DETAIL, invoiceId),
    getCustomerDebt: (customerId: string) =>
      ipcRenderer.invoke(IpcChannels.PAYMENT_GET_CUSTOMER_DEBT, customerId),
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
    getDailySummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_GET_DAILY_SUMMARY, startDate, endDate),
    getProductSummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_GET_PRODUCT_SUMMARY, startDate, endDate),
    getCustomerSummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_GET_CUSTOMER_SUMMARY, startDate, endDate),
    getTruckSummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_GET_TRUCK_SUMMARY, startDate, endDate),
    getInvoiceStatus: () =>
      ipcRenderer.invoke(IpcChannels.REPORT_GET_INVOICE_STATUS),
    getRevenueSummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_GET_REVENUE_SUMMARY, startDate, endDate),
    // Debt & aging reports
    getDebtAging: () =>
      ipcRenderer.invoke(IpcChannels.REPORT_GET_DEBT_AGING),
    getPaymentPerformance: () =>
      ipcRenderer.invoke(IpcChannels.REPORT_GET_PAYMENT_PERFORMANCE),
    getCollectionSummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.REPORT_GET_COLLECTION_SUMMARY, startDate, endDate),
  },

  // Export
  export: {
    exportInvoicePdf: (invoiceId: string) =>
      ipcRenderer.invoke(IpcChannels.EXPORT_INVOICE_PDF, invoiceId),
    exportDailyReportPdf: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.EXPORT_DAILY_REPORT_PDF, startDate, endDate),
    exportProductReportPdf: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.EXPORT_PRODUCT_REPORT_PDF, startDate, endDate),
    exportCustomerReportPdf: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IpcChannels.EXPORT_CUSTOMER_REPORT_PDF, startDate, endDate),
    openPdf: (filepath: string) => ipcRenderer.invoke(IpcChannels.OPEN_PDF_FILE, filepath),
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

  // Auth
  auth: {
    login: (dto: any) => ipcRenderer.invoke(IpcChannels.AUTH_LOGIN, dto),
    logout: () => ipcRenderer.invoke(IpcChannels.AUTH_LOGOUT),
    getCurrentUser: () => ipcRenderer.invoke(IpcChannels.AUTH_GET_CURRENT_USER),
    createUser: (dto: any) => ipcRenderer.invoke(IpcChannels.AUTH_CREATE_USER, dto),
    updateUser: (id: string, dto: any) => ipcRenderer.invoke(IpcChannels.AUTH_UPDATE_USER, { id, dto }),
    deleteUser: (id: string) => ipcRenderer.invoke(IpcChannels.AUTH_DELETE_USER, id),
    getAllUsers: () => ipcRenderer.invoke(IpcChannels.AUTH_GET_ALL_USERS),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronApi = typeof api;
