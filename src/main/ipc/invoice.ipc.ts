import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { InvoiceStatus } from '../../shared/types/enums';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { CreateInvoiceDto, UpdateInvoiceDto, MarkInvoicePaidDto } from '../../shared/types/entities';
import { saveDatabase } from '../database/connection';

export function registerInvoiceIpc(): void {
  const invoiceService = new InvoiceService();
  const paymentService = new PaymentService();

  ipcMain.handle(IpcChannels.INVOICE_GET_ALL, () => invoiceService.getAll());
  
  ipcMain.handle(IpcChannels.INVOICE_GET_BY_ID, (_, id: string) => invoiceService.getById(id));
  
  ipcMain.handle(IpcChannels.INVOICE_GET_BY_CUSTOMER, (_, customerId: string) => 
    invoiceService.getByCustomerId(customerId)
  );

  ipcMain.handle(IpcChannels.INVOICE_CREATE, (_, customerId: string, saleIds: string[], dto: CreateInvoiceDto) => {
    try {
      const invoice = invoiceService.create(customerId, saleIds, dto);
      saveDatabase();
      return { success: true, data: invoice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_UPDATE, (_, id: string, dto: UpdateInvoiceDto) => {
    try {
      const invoice = invoiceService.update(id, dto);
      saveDatabase();
      return { success: true, data: invoice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_ISSUE, (_, id: string) => {
    try {
      const invoice = invoiceService.update(id, { status: InvoiceStatus.ISSUED });
      saveDatabase();
      return { success: true, data: invoice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_MARK_PAID, (_, id: string, dto: MarkInvoicePaidDto) => {
    try {
      const invoice = invoiceService.markAsPaid(id, dto);
      saveDatabase();
      return { success: true, data: invoice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_DELETE, (_, id: string) => {
    try {
      const success = invoiceService.delete(id);
      saveDatabase();
      return { success, message: success ? 'Invoice deleted' : 'Failed to delete invoice' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.PAYMENT_CREATE, (_, paymentDto: any) => {
    try {
      const payment = paymentService.create(paymentDto);
      saveDatabase();
      return { success: true, data: payment };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.PAYMENT_GET_BY_INVOICE, (_, invoiceId: string) => 
    paymentService.getByInvoiceId(invoiceId)
  );
}
