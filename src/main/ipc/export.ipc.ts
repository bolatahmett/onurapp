import { ipcMain, shell } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { PdfExportService } from '../services/pdf-export.service';
import { ReportService } from '../services/report.service';

export function registerExportIpc(): void {
  const pdfService = new PdfExportService();
  const reportService = new ReportService();

  /**
   * Export invoice as PDF
   */
  ipcMain.handle(IpcChannels.EXPORT_INVOICE_PDF, async (_, invoiceId: string) => {
    try {
      const filepath = await pdfService.exportInvoicePdf(invoiceId);
      return { success: true, filepath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Export daily report as PDF
   */
  ipcMain.handle(IpcChannels.EXPORT_DAILY_REPORT_PDF, async (_, startDate: string, endDate: string) => {
    try {
      const summaries = reportService.getDailySummary(startDate, endDate);
      const filepath = await pdfService.exportDailyReportPdf(summaries, startDate, endDate);
      return { success: true, filepath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Export product report as PDF
   */
  ipcMain.handle(IpcChannels.EXPORT_PRODUCT_REPORT_PDF, async (_, startDate: string, endDate: string) => {
    try {
      const summaries = reportService.getProductSummary(startDate, endDate);
      const filepath = await pdfService.exportProductReportPdf(summaries, startDate, endDate);
      return { success: true, filepath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Export customer report as PDF
   */
  ipcMain.handle(IpcChannels.EXPORT_CUSTOMER_REPORT_PDF, async (_, startDate: string, endDate: string) => {
    try {
      const summaries = reportService.getCustomerSummary(startDate, endDate);
      const filepath = await pdfService.exportCustomerReportPdf(summaries, startDate, endDate);
      return { success: true, filepath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Open exported PDF file
   */
  ipcMain.handle(IpcChannels.OPEN_PDF_FILE, async (_, filepath: string) => {
    try {
      await shell.openPath(filepath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
