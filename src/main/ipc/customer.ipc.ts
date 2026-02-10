import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { CustomerService } from '../domain/services/customer.service';
import { CreateCustomerDto, UpdateCustomerDto, MergeCustomerDto } from '../../shared/types/entities';
import { saveDatabase } from '../database/connection';
import {
  CustomerRepository,
  CustomerMergeRepository,
  SaleRepository,
  InvoiceRepository,
  PaymentRepository,
} from '../repositories';

export function registerCustomerIpc(): void {
  // Initialize repositories
  const customerRepo = new CustomerRepository();
  const customerMergeRepo = new CustomerMergeRepository();
  const saleRepo = new SaleRepository();
  const invoiceRepo = new InvoiceRepository();
  const paymentRepo = new PaymentRepository();

  // Initialize domain service with repositories
  const service = new CustomerService(
    customerRepo,
    customerMergeRepo,
    saleRepo,
    invoiceRepo,
    paymentRepo
  );

  ipcMain.handle(IpcChannels.CUSTOMER_GET_ALL, () => service.getAllCustomers());

  ipcMain.handle(IpcChannels.CUSTOMER_GET_ACTIVE, () => service.getActiveCustomers());

  ipcMain.handle(IpcChannels.CUSTOMER_GET_TEMPORARY, () => {
    return service.getAllCustomers().filter(c => c.isTemporary && c.isActive);
  });

  ipcMain.handle(IpcChannels.CUSTOMER_GET_BY_ID, (_, id: string) => service.getCustomer(id));

  ipcMain.handle(IpcChannels.CUSTOMER_CREATE, (_, dto: CreateCustomerDto) => {
    try {
      const customer = service.createCustomer(dto);
      saveDatabase();
      return { success: true, data: customer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_UPDATE, (_, id: string, dto: UpdateCustomerDto) => {
    try {
      const customer = service.updateCustomer(id, dto);
      saveDatabase();
      return { success: true, data: customer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_DELETE, (_, id: string) => {
    try {
      const result = service.updateCustomer(id, { isActive: false });
      saveDatabase();
      return { success: !!result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_MERGE, (_, dto: MergeCustomerDto) => {
    try {
      const merge = service.mergeCustomers(dto.sourceCustomerId, dto.targetCustomerId, dto.mergedByUserId);
      saveDatabase();
      return { success: true, data: merge };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_GET_HISTORY, (_, customerId: string) => {
    try {
      const history = service.getCustomerHistory(customerId);
      return { success: true, data: history };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_GET_SUMMARY, (_, customerId: string) => {
    try {
      const summary = service.getCustomerSummary(customerId);
      return { success: true, data: summary };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_GET_BALANCE, (_, customerId: string) => {
    try {
      const balance = service.getCustomerBalance(customerId);
      return { success: true, data: balance };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_GET_INVOICE_STATUSES, (_, customerId: string) => {
    try {
      const statuses = service.getCustomerInvoiceStatuses(customerId);
      return { success: true, data: statuses };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_GET_WITH_DEBT, () => {
    try {
      const customers = service.getCustomersWithDebt();
      return { success: true, data: customers };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.CUSTOMER_GET_OVER_CREDIT, () => {
    try {
      const customers = service.getCustomersOverCreditLimit();
      return { success: true, data: customers };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
