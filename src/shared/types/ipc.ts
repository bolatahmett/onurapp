export const IpcChannels = {
  // Truck
  TRUCK_GET_ALL: 'truck:getAll',
  TRUCK_GET_BY_ID: 'truck:getById',
  TRUCK_GET_ACTIVE: 'truck:getActive',
  TRUCK_CREATE: 'truck:create',
  TRUCK_UPDATE: 'truck:update',
  TRUCK_CLOSE: 'truck:close',
  TRUCK_DELETE: 'truck:delete',

  // Product
  PRODUCT_GET_ALL: 'product:getAll',
  PRODUCT_GET_ACTIVE: 'product:getActive',
  PRODUCT_GET_BY_ID: 'product:getById',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // Customer
  CUSTOMER_GET_ALL: 'customer:getAll',
  CUSTOMER_GET_ACTIVE: 'customer:getActive',
  CUSTOMER_GET_BY_ID: 'customer:getById',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',

  // Sale
  SALE_GET_ALL: 'sale:getAll',
  SALE_GET_BY_TRUCK: 'sale:getByTruck',
  SALE_GET_BY_CUSTOMER: 'sale:getByCustomer',
  SALE_GET_UNASSIGNED: 'sale:getUnassigned',
  SALE_GET_UNINVOICED: 'sale:getUninvoiced',
  SALE_GET_BY_ID: 'sale:getById',
  SALE_CREATE: 'sale:create',
  SALE_UPDATE: 'sale:update',
  SALE_ASSIGN_CUSTOMER: 'sale:assignCustomer',
  SALE_DELETE: 'sale:delete',

  // Invoice
  INVOICE_GET_ALL: 'invoice:getAll',
  INVOICE_GET_BY_ID: 'invoice:getById',
  INVOICE_CREATE: 'invoice:create',
  INVOICE_UPDATE: 'invoice:update',
  INVOICE_DELETE: 'invoice:delete',
  INVOICE_EXPORT_PDF: 'invoice:exportPdf',

  // Report
  REPORT_DAILY_SUMMARY: 'report:dailySummary',
  REPORT_PRODUCT_SUMMARY: 'report:productSummary',
  REPORT_CUSTOMER_SUMMARY: 'report:customerSummary',
  REPORT_TRUCK_SUMMARY: 'report:truckSummary',
  REPORT_REVENUE_BY_PERIOD: 'report:revenueByPeriod',

  // Backup
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_GET_LOGS: 'backup:getLogs',
  BACKUP_GET_SETTINGS: 'backup:getSettings',
  BACKUP_UPDATE_SETTINGS: 'backup:updateSettings',
  BACKUP_SELECT_FILE: 'backup:selectFile',
  BACKUP_SELECT_DIRECTORY: 'backup:selectDirectory',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
