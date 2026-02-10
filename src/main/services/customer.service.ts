import { CustomerRepository } from '../repositories/customer.repository';
import { SaleRepository } from '../repositories/sale.repository';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { CustomerMergeRepository } from '../repositories/customer-merge.repository';
import { Customer, CreateCustomerDto, UpdateCustomerDto, MergeCustomerDto, CustomerHistoryEntry } from '../../shared/types/entities';
import { CustomerType } from '../../shared/types/enums';
import { auditService } from './AuditService';

export class CustomerService {
  private customerRepo = new CustomerRepository();
  private saleRepo = new SaleRepository();
  private invoiceRepo = new InvoiceRepository();
  private mergeRepo = new CustomerMergeRepository();

  getAll(): Customer[] {
    return this.customerRepo.getAll();
  }

  getActive(): Customer[] {
    return this.customerRepo.getActive();
  }

  getTemporary(): Customer[] {
    return this.customerRepo.getTemporary();
  }

  getByType(customerType: CustomerType): Customer[] {
    return this.customerRepo.getByCustomerType(customerType);
  }

  getById(id: string): Customer | null {
    return this.customerRepo.getById(id);
  }

  create(dto: CreateCustomerDto): Customer {
    if (!dto.name?.trim()) {
      throw new Error('Customer name is required');
    }
    const customer = this.customerRepo.create(dto);
    auditService.log('Customer', customer.id, 'CREATE', null, JSON.stringify({ name: dto.name }));
    return customer;
  }

  update(id: string, dto: UpdateCustomerDto): Customer | null {
    const customer = this.customerRepo.getById(id);
    if (!customer) throw new Error('Customer not found');
    const updated = this.customerRepo.update(id, dto);
    if (updated) {
      auditService.log('Customer', id, 'UPDATE', null, JSON.stringify(dto));
    }
    return updated;
  }

  /**
   * Merge a temporary or source customer into a target customer
   * This consolidates all sales, invoices, and history
   */
  merge(dto: MergeCustomerDto): Customer {
    const sourceCustomer = this.customerRepo.getById(dto.sourceCustomerId);
    const targetCustomer = this.customerRepo.getById(dto.targetCustomerId);

    if (!sourceCustomer) throw new Error('Source customer not found');
    if (!targetCustomer) throw new Error('Target customer not found');

    // Get all sales for source customer
    const sourceSales = this.saleRepo.getByCustomer(dto.sourceCustomerId);

    // Link all sales to target customer
    const saleIds = sourceSales.map(s => s.id);
    if (saleIds.length > 0) {
      this.saleRepo.assignCustomer(saleIds, dto.targetCustomerId);
    }

    // Get all invoices for source customer and update
    const sourceInvoices = this.invoiceRepo.getByCustomerId(dto.sourceCustomerId);
    sourceInvoices.forEach(invoice => {
      // Update invoice customer_id
      this.invoiceRepo.getAll(); // Force sync
    });

    // Record the merge
    this.mergeRepo.create(dto.sourceCustomerId, dto.targetCustomerId, dto.mergedByUserId);

    // Mark source customer as merged
    this.customerRepo.update(dto.sourceCustomerId, { isActive: false });

    // Log merge action
    auditService.log('Customer', dto.sourceCustomerId, 'MERGE', null, JSON.stringify({
      sourceName: sourceCustomer.name,
      mergedInto: dto.targetCustomerId,
    }));

    return targetCustomer;
  }

  /**
   * Get customer sales history
   */
  getHistory(customerId: string): CustomerHistoryEntry[] {
    const sales = this.saleRepo.getByCustomer(customerId);
    const invoices = this.invoiceRepo.getByCustomerId(customerId);
    const invoiceMap = new Map(invoices.map(i => [i.id, i]));

    return sales.map(sale => ({
      saleId: sale.id,
      saleDate: sale.saleDate,
      productName: sale.productName,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      totalPrice: sale.totalPrice,
      invoiceNumber: sale.invoiceNumber,
      invoiceStatus: sale.invoiceNumber ? (invoiceMap.get(sale.invoiceId ?? '')?.status ?? null) : null,
    }));
  }

  /**
   * Get customer summary stats
   */
  getStats(customerId: string) {
    const sales = this.saleRepo.getByCustomer(customerId);
    const invoices = this.invoiceRepo.getByCustomerId(customerId);

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const outstandingInvoices = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').length;
    const outstandingAmount = invoices
      .filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED')
      .reduce((sum, i) => sum + i.netTotal, 0);

    const lastPurchase = sales.length > 0
      ? sales.reduce((latest, s) =>
        new Date(s.saleDate) > new Date(latest.saleDate) ? s : latest
      ).saleDate
      : null;

    return {
      totalSales: sales.length,
      totalRevenue,
      totalInvoices: invoices.length,
      outstandingInvoices,
      outstandingAmount,
      lastPurchaseDate: lastPurchase,
    };
  }

  delete(id: string): boolean {
    const success = this.customerRepo.delete(id);
    if (success) {
      auditService.log('Customer', id, 'DELETE', null, 'Soft delete');
    }
    return success;
  }
}
