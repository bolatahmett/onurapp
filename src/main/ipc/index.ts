import { registerTruckIpc } from './truck.ipc';
import { registerProductIpc } from './product.ipc';
import { registerCustomerIpc } from './customer.ipc';
import { registerSaleIpc } from './sale.ipc';
import { registerInvoiceIpc } from './invoice.ipc';
import { registerReportIpc } from './report.ipc';
import { registerBackupIpc } from './backup.ipc';
import { registerSettingsIpc } from './settings.ipc';

export function registerAllIpc(): void {
  registerTruckIpc();
  registerProductIpc();
  registerCustomerIpc();
  registerSaleIpc();
  registerInvoiceIpc();
  registerReportIpc();
  registerBackupIpc();
  registerSettingsIpc();
}
