export const IpcChannels = {
  // Truck
  TRUCK_GET_ALL: 'truck:getAll',
  TRUCK_GET_BY_ID: 'truck:getById',
  TRUCK_GET_ACTIVE: 'truck:getActive',
  TRUCK_CREATE: 'truck:create',
  TRUCK_UPDATE: 'truck:update',
  TRUCK_CLOSE: 'truck:close',
  TRUCK_DELETE: 'truck:delete',

  // Truck Inventory
  TRUCK_INVENTORY_GET: 'truck:getInventory',
  TRUCK_INVENTORY_ADD: 'truck:addInventory',
  TRUCK_INVENTORY_UPDATE: 'truck:updateInventory',
  TRUCK_INVENTORY_DELETE: 'truck:deleteInventory',
  TRUCK_INVENTORY_GET_REMAINING: 'truck:getRemainingQuantity',
  TRUCK_INVENTORY_CLEAR: 'truck:clearInventory',

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
  CUSTOMER_GET_TEMPORARY: 'customer:getTemporary',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  CUSTOMER_MERGE: 'customer:merge',
  CUSTOMER_GET_HISTORY: 'customer:getHistory',
  CUSTOMER_GET_SUMMARY: 'customer:getSummary',
  CUSTOMER_GET_BALANCE: 'customer:getBalance',
  CUSTOMER_GET_INVOICE_STATUSES: 'customer:getInvoiceStatuses',
  CUSTOMER_GET_WITH_DEBT: 'customer:getWithDebt',
  CUSTOMER_GET_OVER_CREDIT: 'customer:getOverCredit',

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
  INVOICE_GET_BY_CUSTOMER: 'invoice:getByCustomer',
  INVOICE_CREATE: 'invoice:create',
  INVOICE_UPDATE: 'invoice:update',
  INVOICE_DELETE: 'invoice:delete',
  INVOICE_ISSUE: 'invoice:issue',
  INVOICE_EXPORT_PDF: 'invoice:exportPdf',
  INVOICE_PRINT: 'invoice:print',

  // Payment
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_GET_BY_INVOICE: 'payment:getByInvoice',
  PAYMENT_DELETE: 'payment:delete',
  PAYMENT_GET_BY_CUSTOMER: 'payment:getByCustomer',
  PAYMENT_GET_INVOICE_DETAIL: 'payment:getInvoiceDetail',
  PAYMENT_GET_CUSTOMER_DEBT: 'payment:getCustomerDebt',
  INVOICE_MARK_PAID: 'invoice:markPaid',
  INVOICE_GET_PAYMENT_SUMMARY: 'invoice:getPaymentSummary',
  INVOICE_GET_CUSTOMER_WITH_PAYMENTS: 'invoice:getCustomerWithPayments',
  INVOICE_GET_OVERDUE: 'invoice:getOverdue',
  INVOICE_MAKE_PARTIAL_PAYMENT: 'invoice:makePartialPayment',

  // Report
  REPORT_DAILY_SUMMARY: 'report:dailySummary',
  REPORT_PRODUCT_SUMMARY: 'report:productSummary',
  REPORT_CUSTOMER_SUMMARY: 'report:customerSummary',
  REPORT_CUSTOMER_HISTORY: 'report:customerHistory',
  REPORT_TRUCK_SUMMARY: 'report:truckSummary',
  REPORT_REVENUE_BY_PERIOD: 'report:revenueByPeriod',
  REPORT_INVOICE_STATUS: 'report:invoiceStatus',
  REPORT_GET_DAILY_SUMMARY: 'report:getDailySummary',
  REPORT_GET_PRODUCT_SUMMARY: 'report:getProductSummary',
  REPORT_GET_CUSTOMER_SUMMARY: 'report:getCustomerSummary',
  REPORT_GET_TRUCK_SUMMARY: 'report:getTruckSummary',
  REPORT_GET_INVOICE_STATUS: 'report:getInvoiceStatus',
  REPORT_GET_REVENUE_SUMMARY: 'report:getRevenueSummary',
  REPORT_GET_DEBT_AGING: 'report:getDebtAging',
  REPORT_GET_PAYMENT_PERFORMANCE: 'report:getPaymentPerformance',
  REPORT_GET_COLLECTION_SUMMARY: 'report:getCollectionSummary',

  // Export
  EXPORT_REPORT_CSV: 'export:reportCsv',
  EXPORT_REPORT_PDF: 'export:reportPdf',
  EXPORT_INVOICE_PDF: 'export:invoicePdf',
  EXPORT_DAILY_REPORT_PDF: 'export:dailyReportPdf',
  EXPORT_PRODUCT_REPORT_PDF: 'export:productReportPdf',
  EXPORT_CUSTOMER_REPORT_PDF: 'export:customerReportPdf',
  OPEN_PDF_FILE: 'export:openPdf',

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
