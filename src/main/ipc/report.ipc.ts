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
}
