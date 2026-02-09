import { getDatabase } from '../database/connection';
import { saveDatabase } from '../database/connection';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { SaleRepository } from '../repositories/sale.repository';
import { Invoice, InvoiceWithDetails, CreateInvoiceDto, UpdateInvoiceDto } from '../../shared/types/entities';
import { InvoiceStatus } from '../../shared/types/enums';

export class InvoiceService {
  private invoiceRepo = new InvoiceRepository();
  private saleRepo = new SaleRepository();

  getAll(): Invoice[] {
    return this.invoiceRepo.getAll();
  }

  getById(id: string): InvoiceWithDetails | null {
    const invoice = this.invoiceRepo.getById(id);
    if (!invoice) return null;

    const db = getDatabase();

    // Get customer name
    const custStmt = db.prepare('SELECT name FROM customers WHERE id = ?');
    custStmt.bind([invoice.customerId]);
    let customerName = '';
    if (custStmt.step()) {
      customerName = custStmt.getAsObject().name as string;
    }
    custStmt.free();

    // Get sales for this invoice
    const salesStmt = db.prepare(
      `SELECT s.*, t.plate_number as truck_plate_number, p.name as product_name,
              c.name as customer_name, i.invoice_number
       FROM sales s
       JOIN trucks t ON s.truck_id = t.id
       JOIN products p ON s.product_id = p.id
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN invoices i ON s.invoice_id = i.id
       WHERE s.invoice_id = ?
       ORDER BY s.sale_date DESC`
    );
    salesStmt.bind([id]);
    const sales: any[] = [];
    while (salesStmt.step()) {
      const row = salesStmt.getAsObject();
      sales.push({
        id: row.id,
        truckId: row.truck_id,
        productId: row.product_id,
        customerId: row.customer_id,
        invoiceId: row.invoice_id,
        unitType: row.unit_type,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        totalPrice: row.total_price,
        saleDate: row.sale_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        truckPlateNumber: row.truck_plate_number,
        productName: row.product_name,
        customerName: row.customer_name,
        invoiceNumber: row.invoice_number,
      });
    }
    salesStmt.free();

    return { ...invoice, customerName, sales };
  }

  create(dto: CreateInvoiceDto): InvoiceWithDetails {
    if (!dto.customerId) throw new Error('Customer is required');
    if (!dto.saleIds?.length) throw new Error('At least one sale is required');

    const db = getDatabase();

    // Calculate total from selected sales
    let totalAmount = 0;
    for (const saleId of dto.saleIds) {
      const stmt = db.prepare('SELECT total_price FROM sales WHERE id = ?');
      stmt.bind([saleId]);
      if (stmt.step()) {
        totalAmount += (stmt.getAsObject().total_price as number) ?? 0;
      }
      stmt.free();
    }

    const invoiceNumber = this.invoiceRepo.getNextInvoiceNumber();

    // Create invoice
    const invoice = this.invoiceRepo.create(
      invoiceNumber, dto.customerId, totalAmount, dto.notes, dto.dueDate
    );

    // Link sales to invoice and assign customer
    this.saleRepo.linkToInvoice(dto.saleIds, invoice.id);
    this.saleRepo.assignCustomer(dto.saleIds, dto.customerId);

    return this.getById(invoice.id)!;
  }

  update(id: string, dto: UpdateInvoiceDto): Invoice | null {
    const invoice = this.invoiceRepo.getById(id);
    if (!invoice) throw new Error('Invoice not found');

    if (
      invoice.status === InvoiceStatus.CANCELLED &&
      dto.status !== InvoiceStatus.CANCELLED
    ) {
      throw new Error('Cannot modify a cancelled invoice');
    }

    return this.invoiceRepo.update(id, dto);
  }

  delete(id: string): boolean {
    const db = getDatabase();
    // Unlink sales from invoice
    db.run('UPDATE sales SET invoice_id = NULL WHERE invoice_id = ?', [id]);
    saveDatabase();
    return this.invoiceRepo.delete(id);
  }
}
