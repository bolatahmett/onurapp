import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { InvoiceService } from '../domain/services/invoice.service';
import { PaymentService } from '../domain/services/payment.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../../shared/types/entities';
import { PaymentMethod } from '../../shared/types/enums';
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

export function registerInvoiceIpc(): void {
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

  // Initialize domain services with repositories
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

  ipcMain.handle(IpcChannels.INVOICE_GET_ALL, () => invoiceRepo.getAll());

  ipcMain.handle(IpcChannels.INVOICE_GET_BY_ID, (_, id: string) => invoiceService.getInvoiceWithDetails(id));

  ipcMain.handle(IpcChannels.INVOICE_GET_BY_CUSTOMER, (_, customerId: string) =>
    invoiceService.getInvoicesByCustomer(customerId)
  );

  ipcMain.handle(IpcChannels.INVOICE_CREATE, (_, customerId: string, saleIds: string[], dto: CreateInvoiceDto) => {
    try {
      const invoice = invoiceService.createInvoiceFromSales(customerId, saleIds, dto);
      saveDatabase();
      return { success: true, data: invoice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_UPDATE, (_, id: string, dto: UpdateInvoiceDto) => {
    try {
      const invoice = invoiceService.updateInvoice(id, dto);
      saveDatabase();
      return { success: true, data: invoice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_ISSUE, (_, id: string) => {
    try {
      const invoice = invoiceService.issueInvoice(id);
      saveDatabase();
      return { success: true, data: invoice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_MARK_PAID, (_, invoiceId: string, amount: number, method: string) => {
    try {
      const invoice = invoiceService.markAsPaidIfFullyReconciled(invoiceId);
      saveDatabase();
      return { success: true, data: invoice };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_DELETE, (_, id: string) => {
    try {
      invoiceService.cancelInvoice(id);
      saveDatabase();
      return { success: true, message: 'Invoice cancelled' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.PAYMENT_CREATE, (_, invoiceId: string, amount: number, paidDate: string, method: string, notes?: string) => {
    try {
      const paymentMethod = method as PaymentMethod;
      const payment = paymentService.recordPayment(invoiceId, amount, paymentMethod, paidDate, notes);
      saveDatabase();
      return { success: true, data: payment };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.PAYMENT_GET_BY_INVOICE, (_, invoiceId: string) =>
    paymentService.getPaymentsByInvoice(invoiceId)
  );

  ipcMain.handle(IpcChannels.PAYMENT_DELETE, (_, paymentId: string) => {
    try {
      paymentService.reversePayment(paymentId);
      saveDatabase();
      return { success: true, message: 'Payment reversed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.PAYMENT_GET_BY_CUSTOMER, (_, customerId: string) => {
    try {
      const payments = paymentService.getPaymentsByCustomer(customerId);
      return { success: true, data: payments };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.PAYMENT_GET_INVOICE_DETAIL, (_, invoiceId: string) => {
    try {
      const detail = paymentService.getInvoicePaymentDetail(invoiceId);
      return { success: true, data: detail };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.PAYMENT_GET_CUSTOMER_DEBT, (_, customerId: string) => {
    try {
      const debt = paymentService.getCustomerDebtSummary(customerId);
      return { success: true, data: debt };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_GET_PAYMENT_SUMMARY, (_, invoiceId: string) => {
    try {
      const summary = paymentService.getPaymentSummary(invoiceId);
      return { success: true, data: summary };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_GET_OVERDUE, () => {
    try {
      const overdue = invoiceService.getOutstandingInvoices().filter(inv => {
        if (!inv.dueDate) return false;
        return new Date(inv.dueDate) < new Date();
      }).map(inv => {
        const totalPaid = paymentRepo.getTotalPaid(inv.id);
        const remaining = Math.max(0, inv.totalAmount - totalPaid);
        const dueDate = new Date(inv.dueDate!);
        const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const customer = customerRepo.getById(inv.customerId);
        return {
          ...inv,
          totalPaid,
          remainingBalance: remaining,
          daysOverdue,
          customerName: customer?.name ?? null,
        };
      }).filter(inv => inv.remainingBalance > 0.01)
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

      return { success: true, data: overdue };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.INVOICE_MAKE_PARTIAL_PAYMENT,
    (_, invoiceId: string, amount: number, method: string, notes?: string) => {
      try {
        const paymentMethod = method as PaymentMethod;
        const paidDate = new Date().toISOString();
        const payment = paymentService.recordPayment(invoiceId, amount, paymentMethod, paidDate, notes);
        saveDatabase();

        const totalPaid = paymentService.getTotalPaid(invoiceId);
        const invoice = invoiceRepo.getById(invoiceId);
        const remainingBalance = invoice ? Math.max(0, invoice.totalAmount - totalPaid) : 0;
        const isFullyPaid = remainingBalance <= 0.01;

        return {
          success: true,
          data: {
            payment,
            remainingBalance,
            isFullyPaid,
          },
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(IpcChannels.INVOICE_GET_CUSTOMER_WITH_PAYMENTS, (_, customerId: string) => {
    try {
      const invoices = invoiceRepo.getByCustomerId(customerId);
      const result = invoices.map(invoice => {
        const totalPaid = paymentRepo.getTotalPaid(invoice.id);
        const remainingBalance = Math.max(0, invoice.totalAmount - totalPaid);
        const paymentStatus = paymentService.getInvoicePaymentStatus(invoice);
        const daysOverdue = paymentService.getDaysOverdue(invoice);
        const isOverdue = daysOverdue > 0 && remainingBalance > 0.01;

        return {
          ...invoice,
          totalPaid,
          remainingBalance,
          paymentStatus,
          isOverdue,
          daysOverdue,
        };
      });
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
