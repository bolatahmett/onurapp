import { registerTruckIpc } from './truck.ipc';
import { registerProductIpc } from './product.ipc';
import { registerCustomerIpc } from './customer.ipc';
import { registerSaleIpc } from './sale.ipc';
import { registerInvoiceIpc } from './invoice.ipc';
import { registerReportIpc } from './report.ipc';
import { registerExportIpc } from './export.ipc';
import { registerBackupIpc } from './backup.ipc';
import { registerSettingsIpc } from './settings.ipc';
import { registerAuthIpc } from './auth';

export function registerAllIpc(): void {
  registerTruckIpc();
  registerProductIpc();
  registerCustomerIpc();
  registerSaleIpc();
  registerInvoiceIpc();
  registerReportIpc();
  registerExportIpc();
  registerBackupIpc();
  registerSettingsIpc();
  registerAuthIpc();
}
