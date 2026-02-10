import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { SaleService } from '../services/sale.service';
import { InvoiceService } from '../domain/services/invoice.service';
import { PaymentService } from '../domain/services/payment.service';
import { saveDatabase } from '../database/connection';
import {
  InvoiceRepository,
  SaleRepository,
  InvoiceNumberSequenceRepository,
  InvoiceLineItemRepository,
  PaymentRepository,
  CustomerRepository,
  ProductRepository,
  TruckRepository,
  TruckInventoryRepository,
} from '../repositories';
import { CreateInvoiceDto } from '../../shared/types/entities';

export function registerSaleIpc(): void {
  const service = new SaleService();

  // Initialize repositories
  const invoiceRepo = new InvoiceRepository();
  const saleRepo = new SaleRepository();
  const sequenceRepo = new InvoiceNumberSequenceRepository();
  const lineItemRepo = new InvoiceLineItemRepository();
  const paymentRepo = new PaymentRepository();
  const customerRepo = new CustomerRepository();
  const productRepo = new ProductRepository();
  const truckRepo = new TruckRepository();
  const truckInventoryRepo = new TruckInventoryRepository();

  // Initialize domain services (matching new constructors)
  const invoiceService = new InvoiceService(
    invoiceRepo,
    saleRepo,
    sequenceRepo,
    lineItemRepo,
    paymentRepo,
    customerRepo,
    productRepo,
    truckRepo,
    truckInventoryRepo
  );

  const paymentService = new PaymentService(
    paymentRepo,
    invoiceRepo,
    customerRepo
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
        const invoice = invoiceService.createInvoiceFromSales(
          dto.customerId,
          [sale.id],
          { customerId: dto.customerId, saleIds: [sale.id] }
        );

        if (invoice) {
          // Issue the invoice first (before recording payment) with the sale date
          invoiceService.issueInvoice(invoice.id, sale.saleDate);

          // Then record payment if sale had a payment
          if (sale.paidAmount && sale.paidAmount > 0) {
            paymentService.recordPayment(
              invoice.id,
              sale.paidAmount,
              'CASH' as any,
              sale.saleDate,
              'Otomatik satış ödemesi'
            );
          }
        }

        saveDatabase();
      }
    } catch (err) {
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
