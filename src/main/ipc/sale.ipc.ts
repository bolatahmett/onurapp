import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { SaleService } from '../services/sale.service';
import { InvoiceService } from '../domain/services/invoice.service';
import { saveDatabase } from '../database/connection';
import {
  InvoiceRepository,
  SaleRepository,
  InvoiceNumberSequenceRepository,
  InvoiceLineItemRepository,
  AuditLogRepository,
  PaymentRepository,
  CustomerRepository,
  ProductRepository,
  TruckRepository,
  TruckInventoryRepository,
} from '../repositories';
import { CreateInvoiceDto } from '../../shared/types/entities';

export function registerSaleIpc(): void {
  const service = new SaleService();

  // Initialize invoice service so we can auto-create invoices when requested
  const invoiceRepo = new InvoiceRepository();
  const saleRepo = new SaleRepository();
  const sequenceRepo = new InvoiceNumberSequenceRepository();
  const lineItemRepo = new InvoiceLineItemRepository();
  const auditRepo = new AuditLogRepository();
  const paymentRepo = new PaymentRepository();
  const customerRepo = new CustomerRepository();
  const productRepo = new ProductRepository();
  const truckRepo = new TruckRepository();
  const truckInventoryRepo = new TruckInventoryRepository();

  const invoiceService = new InvoiceService(
    invoiceRepo,
    saleRepo,
    sequenceRepo,
    lineItemRepo,
    auditRepo,
    paymentRepo,
    customerRepo,
    productRepo,
    truckRepo,
    truckInventoryRepo
  );

  ipcMain.handle(IpcChannels.SALE_GET_ALL, () => service.getAll());
  ipcMain.handle(IpcChannels.SALE_GET_BY_TRUCK, (_, truckId: string) => service.getByTruck(truckId));
  ipcMain.handle(IpcChannels.SALE_GET_BY_CUSTOMER, (_, customerId: string) => service.getByCustomer(customerId));
  ipcMain.handle(IpcChannels.SALE_GET_UNASSIGNED, () => service.getUnassigned());
  ipcMain.handle(IpcChannels.SALE_GET_UNINVOICED, (_, customerId?: string) => service.getUninvoiced(customerId));
  ipcMain.handle(IpcChannels.SALE_GET_BY_ID, (_, id: string) => service.getById(id));
  
  ipcMain.handle(IpcChannels.SALE_CREATE, (_, dto) => {
    const sale = service.create(dto);
    try {
      // If client requested auto-invoice and sale has a customer, create invoice
      if (dto.autoInvoice && dto.customerId) {
        invoiceService.createInvoiceFromSales(dto.customerId, [sale.id], { customerId: dto.customerId, saleIds: [sale.id] });
        saveDatabase();
      }
    } catch (err) {
      // swallow invoice creation errors to not break sale creation; log later if needed
      console.error('Auto-invoice creation failed:', err);
    }
    return sale;
  });
  
  ipcMain.handle(IpcChannels.SALE_UPDATE, (_, id: string, dto) => service.update(id, dto));
  ipcMain.handle(IpcChannels.SALE_ASSIGN_CUSTOMER, (_, saleIds: string[], customerId: string) =>
    service.assignCustomer(saleIds, customerId)
  );
  ipcMain.handle(IpcChannels.SALE_DELETE, (_, id: string) => service.delete(id));
}
