/**
 * InvoiceService
 * ===============
 * High-level business logic for invoice management
 * Orchestrates repository calls, calculations, and transactions
 * 
 * Responsibilities:
 * - Create invoices from sales
 * - Update invoice status (DRAFT → ISSUED → PAID)
 * - Calculate totals, discounts, taxes
 * - Link/unlink sales to invoices
 * - Generate invoice numbers
 */

import {
  Invoice,
  InvoiceWithDetails,
  InvoiceLineItem,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  SaleWithDetails,
  Sale,
} from '../../../shared/types/entities';
import { InvoiceStatus, AuditAction } from '../../../shared/types/enums';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { SaleRepository } from '../../repositories/sale.repository';
import { InvoiceNumberSequenceRepository } from '../../repositories/invoice-sequence.repository';
import { InvoiceLineItemRepository } from '../../repositories/invoice-line-item.repository';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { PaymentRepository } from '../../repositories/payment.repository';
import { CustomerRepository } from '../../repositories/customer.repository';
import { ProductRepository } from '../../repositories/product.repository';
import { TruckRepository } from '../../repositories/truck.repository';

export class InvoiceService {
  constructor(
    private invoiceRepo: InvoiceRepository,
    private saleRepo: SaleRepository,
    private sequenceRepo: InvoiceNumberSequenceRepository,
    private lineItemRepo: InvoiceLineItemRepository,
    private auditRepo: AuditLogRepository,
    private paymentRepo: PaymentRepository,
    private customerRepo: CustomerRepository,
    private productRepo: ProductRepository,
    private truckRepo: TruckRepository
  ) {}

  /**
   * Create a new invoice from one or more sales
   * ATOMIC TRANSACTION:
   * 1. Generate invoice number
   * 2. Create invoice record (status=DRAFT)
   * 3. For each sale: create line item mapping
   * 4. Update sales: mark as invoiced, link to invoice
   * 5. Recalculate totals
   * 6. Log audit entry
   */
  createInvoiceFromSales(customerId: string, saleIds: string[], dto: CreateInvoiceDto): Invoice {
    // Validate input
    if (!customerId || !saleIds || saleIds.length === 0) {
      throw new Error('Invalid input: customerId and saleIds are required');
    }

    try {
      // Generate unique invoice number
      const invoiceNumber = this.sequenceRepo.getNextInvoiceNumber();

      // Create invoice (status=DRAFT)
      const invoice = this.invoiceRepo.create(invoiceNumber, customerId, dto);

      // Fetch sales and build line items
      let totalSubtotal = 0;
      saleIds.forEach((saleId, index) => {
        const sale = this.saleRepo.getById(saleId);
        if (!sale) {
          throw new Error(`Sale ${saleId} not found`);
        }

        // Create line item from sale
        const lineItem = this.lineItemRepo.create({
          invoiceId: invoice.id,
          saleId: sale.id,
          sequenceNumber: index + 1,
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
          discountType: sale.discountType,
          discountAmount: sale.discountAmount,
          lineTotal: sale.totalPrice,
        });

        totalSubtotal += sale.totalPrice;

        // Mark sale as invoiced
        this.saleRepo.update(sale.id, {
          invoiceId: invoice.id,
        });
      });

      // Recalculate and update invoice totals
      const taxRate = dto.taxRate ?? 0;
      const taxAmount = totalSubtotal * (taxRate / 100);
      const netTotal = totalSubtotal + taxAmount;

      this.invoiceRepo.updateTotals(invoice.id, totalSubtotal, taxRate);

      // Log audit entry
      this.auditRepo.log('invoice', invoice.id, AuditAction.CREATE, null, {
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        totalAmount: netTotal,
        saleCount: saleIds.length,
      });

      return this.invoiceRepo.getById(invoice.id)!;
    } catch (err: any) {
      throw new Error(`Failed to create invoice: ${err.message}`);
    }
  }

  /**
   * Get invoice with full details (customer, line items, payments)
   */
  getInvoiceWithDetails(invoiceId: string): InvoiceWithDetails | null {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) return null;

    // Fetch line items and related sales
    const lineItems = this.lineItemRepo.getByInvoiceId(invoiceId);
    const sales: SaleWithDetails[] = [];

    for (const item of lineItems as InvoiceLineItem[]) {
      if (item.saleId) {
        const sale = this.saleRepo.getById(item.saleId);
        if (sale) {
          // Convert to SaleWithDetails (fetch truck, product, customer names)
          const saleDetail = this.enrichSaleWithDetails(sale);
          sales.push(saleDetail);
        }
      }
    }

    const customer = this.customerRepo.getById(invoice.customerId);
    const customerName = customer?.name || '';

    return {
      ...invoice,
      customerName,
      sales,
    };
  }

  /**
   * Update invoice (change status, due date, notes)
   * Handles status transitions and ensures valid state changes
   */
  updateInvoice(invoiceId: string, dto: UpdateInvoiceDto): Invoice | null {
    const current = this.invoiceRepo.getById(invoiceId);
    if (!current) return null;

    // Validate status transitions
    if (dto.status && !this.isValidStatusTransition(current.status, dto.status)) {
      throw new Error(
        `Invalid status transition: ${current.status} → ${dto.status}`
      );
    }

    // Update invoice
    const updated = this.invoiceRepo.update(invoiceId, dto);

    // Log audit entry
    this.auditRepo.log('invoice', invoiceId, AuditAction.UPDATE, current, updated);

    return updated;
  }

  /**
   * Issue an invoice (change status from DRAFT to ISSUED)
   * Sets the issueDate to now
   */
  issueInvoice(invoiceId: string): Invoice | null {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) return null;

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error(`Only DRAFT invoices can be issued (current: ${invoice.status})`);
    }

    const now = new Date().toISOString();
    return this.updateInvoice(invoiceId, {
      status: InvoiceStatus.ISSUED,
      issueDate: now,
    });
  }

  /**
   * Mark invoice as paid (full or partial)
   * This is called by PaymentService after payment is recorded
   */
  markAsPaidIfFullyReconciled(invoiceId: string): Invoice {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    // Calculate total paid from payments
    const totalPaid = this.paymentRepo.getTotalPaid(invoiceId);

    // If fully paid, update status
    if (totalPaid >= invoice.totalAmount) {
      const now = new Date().toISOString();
      return this.updateInvoice(invoiceId, {
        status: InvoiceStatus.PAID,
        paymentReceivedDate: now,
      })!;
    }

    return invoice;
  }

  /**
   * Cancel an invoice (only allowed for DRAFT or ISSUED)
   */
  cancelInvoice(invoiceId: string, reason?: string): Invoice | null {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) return null;

    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error(
        `Cannot cancel ${invoice.status} invoices`
      );
    }

    // Unlink all sales from this invoice
    const lineItems = this.lineItemRepo.getByInvoiceId(invoiceId);
    for (const item of lineItems) {
      if (item.saleId) {
        this.saleRepo.update(item.saleId, { invoiceId: null });
      }
    }

    // Update invoice status
    const updated = this.updateInvoice(invoiceId, {
      status: InvoiceStatus.CANCELLED,
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
    });

    return updated;
  }

  /**
   * Add a sale to an existing draft invoice
   */
  addSaleToInvoice(invoiceId: string, saleId: string): InvoiceLineItem {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error(`Can only add sales to DRAFT invoices (current: ${invoice.status})`);
    }

    const sale = this.saleRepo.getById(saleId);
    if (!sale) {
      throw new Error(`Sale ${saleId} not found`);
    }

    // Check if sale is already invoiced
    if (sale.invoiceId) {
      throw new Error(`Sale ${saleId} is already linked to invoice ${sale.invoiceId}`);
    }

    // Get sequence number for new line
    const existingItems = this.lineItemRepo.getByInvoiceId(invoiceId);
    const nextSequence = (existingItems.length || 0) + 1;

    // Create line item
    const lineItem = this.lineItemRepo.create({
      invoiceId,
      saleId,
      sequenceNumber: nextSequence,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      discountType: sale.discountType,
      discountAmount: sale.discountAmount,
      lineTotal: sale.totalPrice,
    });

    // Link sale to invoice
    this.saleRepo.update(saleId, { invoiceId });

    // Recalculate invoice totals
    this.recalculateInvoiceTotals(invoiceId);

    // Log audit
    this.auditRepo.log('invoice_line_item', lineItem.id, AuditAction.CREATE, null, {
      invoiceId,
      saleId,
    });

    return lineItem;
  }

  /**
   * Remove a sale from a draft invoice
   */
  removeSaleFromInvoice(invoiceId: string, saleId: string): void {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error(`Can only remove sales from DRAFT invoices`);
    }

    // Find and remove line item
    const lineItems = this.lineItemRepo.getByInvoiceId(invoiceId);
    const lineItem = lineItems.find(l => l.saleId === saleId);
    if (!lineItem) {
      throw new Error(`Sale ${saleId} is not in this invoice`);
    }

    // Unlink sale
    this.saleRepo.update(saleId, { invoiceId: null });

    // Delete line item
    this.lineItemRepo.delete(lineItem.id);

    // Recalculate totals
    this.recalculateInvoiceTotals(invoiceId);

    // Log audit
    this.auditRepo.log('invoice_line_item', lineItem.id, AuditAction.DELETE, lineItem, null);
  }

  /**
   * Get all outstanding invoices (DRAFT or ISSUED)
   */
  getOutstandingInvoices(): Invoice[] {
    return this.invoiceRepo.getOutstandingInvoices();
  }

  /**
   * Get all invoices for a customer
   */
  getInvoicesByCustomer(customerId: string): Invoice[] {
    return this.invoiceRepo.getByCustomerId(customerId);
  }

  /**
   * Get all invoices with a specific status
   */
  getInvoicesByStatus(status: InvoiceStatus): Invoice[] {
    return this.invoiceRepo.getByStatus(status);
  }

  // Helper methods
  /**
   * Recalculate invoice totals from line items
   */
  private recalculateInvoiceTotals(invoiceId: string): void {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) return;

    const lineItems = this.lineItemRepo.getByInvoiceId(invoiceId);
    const subtotal = lineItems.reduce((sum: number, item: InvoiceLineItem) => sum + item.lineTotal, 0);

    this.invoiceRepo.updateTotals(invoiceId, subtotal, invoice.taxRate);
  }

  /**
   * Check if a status transition is valid
   */
  private isValidStatusTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      [InvoiceStatus.DRAFT]: [InvoiceStatus.ISSUED, InvoiceStatus.CANCELLED],
      [InvoiceStatus.ISSUED]: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
      [InvoiceStatus.PAID]: [],
      [InvoiceStatus.CANCELLED]: [],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Enrich a sale with customer/product/truck details
   */
  private enrichSaleWithDetails(sale: Sale): SaleWithDetails {
    const truck = this.truckRepo.getById(sale.truckId);
    const product = this.productRepo.getById(sale.productId);
    const customer = sale.customerId ? this.customerRepo.getById(sale.customerId) : null;
    const invoice = sale.invoiceId ? this.invoiceRepo.getById(sale.invoiceId) : null;

    return {
      ...sale,
      truckPlateNumber: truck?.plateNumber || '',
      productName: product?.name || '',
      customerName: customer?.name || null,
      invoiceNumber: invoice?.invoiceNumber || null,
    };
  }
}

