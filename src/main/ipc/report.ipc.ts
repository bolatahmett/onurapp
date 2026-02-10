import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { ReportService } from '../services/report.service';

export function registerReportIpc(): void {
  const service = new ReportService();

  ipcMain.handle(IpcChannels.REPORT_DAILY_SUMMARY, (_, startDate: string, endDate: string) =>
    service.getDailySummary(startDate, endDate)
  );
  ipcMain.handle(IpcChannels.REPORT_PRODUCT_SUMMARY, (_, startDate: string, endDate: string) =>
    service.getProductSummary(startDate, endDate)
  );
  ipcMain.handle(IpcChannels.REPORT_CUSTOMER_SUMMARY, (_, startDate: string, endDate: string) =>
    service.getCustomerSummary(startDate, endDate)
  );
  ipcMain.handle(IpcChannels.REPORT_TRUCK_SUMMARY, (_, startDate: string, endDate: string) =>
    service.getTruckSummary(startDate, endDate)
  );
  ipcMain.handle(
    IpcChannels.REPORT_REVENUE_BY_PERIOD,
    (_, period: 'daily' | 'weekly' | 'monthly', startDate: string, endDate: string) =>
      service.getRevenueByPeriod(period, startDate, endDate)
  );

  // New handlers with proper error handling
  ipcMain.handle(IpcChannels.REPORT_GET_DAILY_SUMMARY, (_, startDate: string, endDate: string) => {
    try {
      const summaries = service.getDailySummary(startDate, endDate);
      return { success: true, data: summaries };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.REPORT_GET_PRODUCT_SUMMARY, (_, startDate: string, endDate: string) => {
    try {
      const summaries = service.getProductSummary(startDate, endDate);
      return { success: true, data: summaries };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.REPORT_GET_CUSTOMER_SUMMARY, (_, startDate: string, endDate: string) => {
    try {
      const summaries = service.getCustomerSummary(startDate, endDate);
      return { success: true, data: summaries };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.REPORT_GET_TRUCK_SUMMARY, (_, startDate: string, endDate: string) => {
    try {
      const summaries = service.getTruckSummary(startDate, endDate);
      return { success: true, data: summaries };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.REPORT_GET_INVOICE_STATUS, () => {
    try {
      const summary = service.getInvoiceStatus();
      return { success: true, data: summary };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.REPORT_GET_REVENUE_SUMMARY, (_, startDate: string, endDate: string) => {
    try {
      const summary = service.getRevenueSummary(startDate, endDate);
      return { success: true, data: summary };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // =========================================================================
  // Debt & Aging Reports
  // =========================================================================

  ipcMain.handle(IpcChannels.REPORT_GET_DEBT_AGING, () => {
    try {
      const report = service.getDebtAgingReport();
      return { success: true, data: report };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.REPORT_GET_PAYMENT_PERFORMANCE, () => {
    try {
      const report = service.getCustomerPaymentPerformance();
      return { success: true, data: report };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IpcChannels.REPORT_GET_COLLECTION_SUMMARY, (_, startDate: string, endDate: string) => {
    try {
      const summary = service.getCollectionSummary(startDate, endDate);
      return { success: true, data: summary };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
