import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { app } from 'electron';
import { join } from 'path';
import { Invoice, DailySummary, ProductSummary, CustomerSummary, InvoiceLineItem } from '../../shared/types/entities';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { SaleRepository } from '../repositories/sale.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { PaymentRepository } from '../repositories/payment.repository';

export class PdfExportService {
  private invoiceRepo: InvoiceRepository;
  private saleRepo: SaleRepository;
  private customerRepo: CustomerRepository;
  private paymentRepo: PaymentRepository;

  constructor() {
    this.invoiceRepo = new InvoiceRepository();
    this.saleRepo = new SaleRepository();
    this.customerRepo = new CustomerRepository();
    this.paymentRepo = new PaymentRepository();
  }

  /**
   * Export invoice as PDF
   */
  exportInvoicePdf(invoiceId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const invoice = this.invoiceRepo.getById(invoiceId);
      if (!invoice) {
        return reject(new Error('Invoice not found'));
      }

      const customer = this.customerRepo.getById(invoice.customerId);
      if (!customer) {
        return reject(new Error('Customer not found'));
      }

      const filename = `Invoice_${invoice.invoiceNumber}_${Date.now()}.pdf`;
      const filepath = join(app.getPath('downloads'), filename);

      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Invoice', { align: 'center' });
      doc.moveDown();

      // Invoice details
      doc.fontSize(11).font('Helvetica');
      const startX = 50;
      const rightX = 350;

      // Left column: Company info
      doc.text('Company Name', startX, doc.y, { width: 200 });
      doc.text('Invoice Number: ' + invoice.invoiceNumber, startX, doc.y + 20);
      doc.text('Date: ' + new Date(invoice.createdAt).toLocaleDateString(), startX, doc.y + 15);
      doc.text('Status: ' + invoice.status, startX, doc.y + 15);

      // Right column: Customer info
      doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', rightX, doc.y - 50);
      doc.font('Helvetica').fontSize(10);
      doc.text(customer.name, rightX, doc.y);
      if (customer.address) doc.text('Address: ' + customer.address);
      if (customer.phone) doc.text('Phone: ' + customer.phone);
      if (customer.email) doc.text('Email: ' + customer.email);
      if (customer.taxNumber) doc.text('Tax Number: ' + customer.taxNumber);

      // Move down for line items
      doc.moveDown(3);
      const tableTop = doc.y;

      // Table header
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Description', startX, tableTop);
      doc.text('Qty', startX + 250, tableTop);
      doc.text('Unit Price', startX + 300, tableTop);
      doc.text('Amount', startX + 380, tableTop);

      // Horizontal line
      doc.moveTo(startX, tableTop + 20).lineTo(500, tableTop + 20).stroke();

      // Get line items
      const lineItems = this.invoiceRepo.getLineItems(invoiceId);
      let currentY = tableTop + 30;
      doc.font('Helvetica').fontSize(10);

      lineItems.forEach((item: InvoiceLineItem) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        doc.text(`Item #${item.sequenceNumber}`, startX, currentY);
        doc.text(item.quantity.toString(), startX + 250, currentY);
        doc.text(`$${item.unitPrice.toFixed(2)}`, startX + 300, currentY);
        doc.text(`$${item.lineTotal.toFixed(2)}`, startX + 380, currentY);
        currentY += 25;
      });

      // Summary section
      currentY += 20;
      doc.moveTo(startX, currentY).lineTo(500, currentY).stroke();
      currentY += 15;

      doc.fontSize(11).font('Helvetica');
      doc.text('Subtotal:', startX + 280, currentY);
      doc.text(`$${invoice.subtotal.toFixed(2)}`, startX + 380, currentY);

      currentY += 20;
      doc.text(`Tax (${(invoice.taxRate * 100).toFixed(1)}%):`, startX + 280, currentY);
      doc.text(`$${invoice.taxAmount.toFixed(2)}`, startX + 380, currentY);

      currentY += 20;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total:', startX + 280, currentY);
      doc.text(`$${invoice.netTotal.toFixed(2)}`, startX + 380, currentY);

      // Payment info
      if (invoice.status === 'PAID') {
        currentY += 40;
        doc.fontSize(10).font('Helvetica');
        doc.text(`Paid on: ${new Date(invoice.paymentReceivedDate!).toLocaleDateString()}`, startX);
        doc.text(`Payment Method: ${invoice.paymentMethod || 'N/A'}`, startX);
      }

      // Footer
      doc.fontSize(9).font('Helvetica').fillColor('#999999');
      doc.text('Thank you for your business!', startX, doc.page.height - 50, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Export daily summary report as PDF
   */
  exportDailyReportPdf(summaries: DailySummary[], startDate: string, endDate: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const filename = `DailyReport_${startDate}_to_${endDate}_${Date.now()}.pdf`;
      const filepath = join(app.getPath('downloads'), filename);

      const doc = new PDFDocument({ margin: 40 });
      const stream = createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Daily Sales Report', { align: 'center' });
      doc.fontSize(11).font('Helvetica').text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
      doc.moveDown();

      let currentY = doc.y;
      const startX = 50;

      // Table header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Date', startX, currentY);
      doc.text('Trucks', startX + 100, currentY);
      doc.text('Sales Count', startX + 150, currentY);
      doc.text('Total Revenue', startX + 250, currentY);

      currentY += 20;
      doc.moveTo(startX, currentY).lineTo(500, currentY).stroke();
      currentY += 10;

      doc.font('Helvetica').fontSize(9);
      let totalRevenue = 0;

      summaries.forEach((summary) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        const date = new Date(summary.date).toLocaleDateString();
        doc.text(date, startX, currentY);
        doc.text(summary.totalTrucks.toString(), startX + 100, currentY);
        doc.text(summary.totalSales.toString(), startX + 150, currentY);
        doc.text(`$${summary.totalRevenue.toFixed(2)}`, startX + 250, currentY);

        totalRevenue += summary.totalRevenue;
        currentY += 15;
      });

      currentY += 10;
      doc.moveTo(startX, currentY).lineTo(500, currentY).stroke();
      currentY += 15;

      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('Total Revenue:', startX + 250, currentY);
      doc.text(`$${totalRevenue.toFixed(2)}`, startX + 380, currentY);

      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Export product summary report as PDF
   */
  exportProductReportPdf(summaries: ProductSummary[], startDate: string, endDate: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const filename = `ProductReport_${startDate}_to_${endDate}_${Date.now()}.pdf`;
      const filepath = join(app.getPath('downloads'), filename);

      const doc = new PDFDocument({ margin: 40 });
      const stream = createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Product Sales Report', { align: 'center' });
      doc.fontSize(11).font('Helvetica').text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
      doc.moveDown();

      let currentY = doc.y;
      const startX = 50;

      // Table header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Product', startX, currentY);
      doc.text('Qty Sold', startX + 200, currentY);
      doc.text('Sales Count', startX + 280, currentY);
      doc.text('Revenue', startX + 380, currentY);

      currentY += 20;
      doc.moveTo(startX, currentY).lineTo(500, currentY).stroke();
      currentY += 10;

      doc.font('Helvetica').fontSize(9);
      let totalRevenue = 0;

      summaries.forEach((summary) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.text(summary.productName.substring(0, 30), startX, currentY);
        doc.text(summary.totalQuantity.toString(), startX + 200, currentY);
        doc.text(summary.saleCount.toString(), startX + 280, currentY);
        doc.text(`$${summary.totalRevenue.toFixed(2)}`, startX + 380, currentY);

        totalRevenue += summary.totalRevenue;
        currentY += 15;
      });

      currentY += 10;
      doc.moveTo(startX, currentY).lineTo(500, currentY).stroke();
      currentY += 15;

      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('Total Revenue:', startX + 380, currentY);
      doc.text(`$${totalRevenue.toFixed(2)}`, startX + 380, currentY);

      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Export customer summary report as PDF
   */
  exportCustomerReportPdf(summaries: CustomerSummary[], startDate: string, endDate: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const filename = `CustomerReport_${startDate}_to_${endDate}_${Date.now()}.pdf`;
      const filepath = join(app.getPath('downloads'), filename);

      const doc = new PDFDocument({ margin: 40 });
      const stream = createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Customer Sales Report', { align: 'center' });
      doc.fontSize(11).font('Helvetica').text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
      doc.moveDown();

      let currentY = doc.y;
      const startX = 50;

      // Table header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Customer', startX, currentY);
      doc.text('Purchases', startX + 180, currentY);
      doc.text('Outstanding', startX + 280, currentY);
      doc.text('Total Amount', startX + 360, currentY);

      currentY += 20;
      doc.moveTo(startX, currentY).lineTo(500, currentY).stroke();
      currentY += 10;

      doc.font('Helvetica').fontSize(9);
      let totalAmount = 0;

      summaries.forEach((summary) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.text(summary.customerName.substring(0, 30), startX, currentY);
        doc.text(summary.totalPurchases.toString(), startX + 180, currentY);
        doc.text(summary.outstandingInvoices.toString(), startX + 280, currentY);
        doc.text(`$${summary.totalAmount.toFixed(2)}`, startX + 360, currentY);

        totalAmount += summary.totalAmount;
        currentY += 15;
      });

      currentY += 10;
      doc.moveTo(startX, currentY).lineTo(500, currentY).stroke();
      currentY += 15;

      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('Total', startX + 360, currentY);
      doc.text(`$${totalAmount.toFixed(2)}`, startX + 360, currentY);

      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
}
