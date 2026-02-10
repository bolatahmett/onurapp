/**
 * CustomerService
 * ===============
 * Business logic for customer management and consolidation
 * 
 * Responsibilities:
 * - Customer CRUD operations
 * - Customer merge (consolidate temporary to permanent)
 * - Fetch sales and invoices by customer
 * - Maintain customer history
 */

import {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  Sale,
  Invoice,
  CustomerHistoryEntry,
  CustomerMerge,
} from '../../../shared/types/entities';
import { AuditAction } from '../../../shared/types/enums';
import { CustomerRepository } from '../../repositories/customer.repository';
import { CustomerMergeRepository } from '../../repositories/customer-merge.repository';
import { SaleRepository } from '../../repositories/sale.repository';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { AuditLogRepository } from '../../repositories/audit-log.repository';

export class CustomerService {
  constructor(
    private customerRepo: CustomerRepository,
    private customerMergeRepo: CustomerMergeRepository,
    private saleRepo: SaleRepository,
    private invoiceRepo: InvoiceRepository,
    private auditRepo: AuditLogRepository
  ) {}

  /**
   * Create a new customer
   */
  createCustomer(dto: CreateCustomerDto): Customer {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Customer name is required');
    }

    try {
      const customer = this.customerRepo.create(dto);

      // Log audit
      this.auditRepo.log('customer', customer.id, AuditAction.CREATE, null, {
        name: customer.name,
        isTemporary: customer.isTemporary,
      });

      return customer;
    } catch (err: any) {
      throw new Error(`Failed to create customer: ${err.message}`);
    }
  }

  /**
   * Get customer by ID
   */
  getCustomer(customerId: string): Customer | null {
    return this.customerRepo.getById(customerId);
  }

  /**
   * Get all customers
   */
  getAllCustomers(): Customer[] {
    return this.customerRepo.getAll();
  }

  /**
   * Get only active customers
   */
  getActiveCustomers(): Customer[] {
    return this.customerRepo.getActive();
  }

  /**
   * Update customer details
   */
  updateCustomer(customerId: string, dto: UpdateCustomerDto): Customer | null {
    const current = this.customerRepo.getById(customerId);
    if (!current) return null;

    try {
      this.customerRepo.update(customerId, dto);
      const updated = this.customerRepo.getById(customerId)!;

      // Log audit
      this.auditRepo.log('customer', customerId, AuditAction.UPDATE, current, updated);

      return updated;
    } catch (err: any) {
      throw new Error(`Failed to update customer: ${err.message}`);
    }
  }

  /**
   * Merge two customers
   * ATOMIC TRANSACTION:
   * 1. Validate both customers exist
   * 2. Fetch all sales/invoices for source
   * 3. Update all sales: customerId = target
   * 4. Update all invoices: customerId = target
   * 5. Create merge record
   * 6. Deactivate source customer
   * 7. Log audit entries
   */
  mergeCustomers(
    sourceCustomerId: string,
    targetCustomerId: string,
    mergedByUserId?: string
  ): void {
    // Validate
    const source = this.customerRepo.getById(sourceCustomerId);
    if (!source) {
      throw new Error(`Source customer ${sourceCustomerId} not found`);
    }

    const target = this.customerRepo.getById(targetCustomerId);
    if (!target) {
      throw new Error(`Target customer ${targetCustomerId} not found`);
    }

    if (sourceCustomerId === targetCustomerId) {
      throw new Error('Cannot merge customer with itself');
    }

    try {
      // Fetch all sales for source (will be updated)
      const sourceSales = this.saleRepo.getByCustomer(sourceCustomerId);
      const sourceInvoices = this.invoiceRepo.getByCustomerId(sourceCustomerId);

      // Update all sales to point to target
      for (const sale of sourceSales) {
        this.saleRepo.update(sale.id, {
          customerId: targetCustomerId,
        });
      }

      // Update all invoices to point to target
      for (const invoice of sourceInvoices) {
        this.invoiceRepo.update(invoice.id, {
          customerId: targetCustomerId,
        });
      }

      // Create merge record
      const merge = this.customerMergeRepo.create(
        sourceCustomerId,
        targetCustomerId,
        mergedByUserId
      );

      // Deactivate source customer
      this.customerRepo.update(sourceCustomerId, {
        isActive: false,
      });

      // Log audit entries
      this.auditRepo.log('customer', sourceCustomerId, AuditAction.UPDATE, source, {
        ...source,
        isActive: false,
      });

      this.auditRepo.log(
        'customer_merge',
        merge.id,
        AuditAction.MERGE,
        null,
        {
          sourceCustomerId,
          targetCustomerId,
          saleCount: sourceSales.length,
          invoiceCount: sourceInvoices.length,
        }
      );
    } catch (err: any) {
      throw new Error(`Failed to merge customers: ${err.message}`);
    }
  }

  /**
   * Get all sales for a customer (including merged customers if applicable)
   */
  getCustomerSales(customerId: string): Sale[] {
    return this.saleRepo.getByCustomer(customerId);
  }

  /**
   * Get all invoices for a customer
   */
  getCustomerInvoices(customerId: string): Invoice[] {
    return this.invoiceRepo.getByCustomerId(customerId);
  }

  /**
   * Get customer transaction history (sales + invoices combined)
   */
  getCustomerHistory(customerId: string): CustomerHistoryEntry[] {
    const sales = this.getCustomerSales(customerId);
    const invoices = this.getCustomerInvoices(customerId);

    const history: CustomerHistoryEntry[] = [];

    // Add sales to history
    for (const sale of sales) {
      const relatedInvoice = sale.invoiceId
        ? invoices.find(inv => inv.id === sale.invoiceId)
        : null;

      history.push({
        saleId: sale.id,
        saleDate: sale.saleDate,
        productName: '', // TODO: fetch from product repo
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        totalPrice: sale.totalPrice,
        invoiceNumber: relatedInvoice?.invoiceNumber ?? null,
        invoiceStatus: relatedInvoice?.status ?? null,
      });
    }

    // Sort by date descending
    history.sort((a: CustomerHistoryEntry, b: CustomerHistoryEntry) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

    return history;
  }

  /**
   * Get customer purchase summary
   */
  getCustomerSummary(customerId: string): {
    customer: Customer;
    totalSales: number;
    totalAmount: number;
    lastPurchaseDate: string | null;
    outstandingInvoices: number;
  } {
    const customer = this.customerRepo.getById(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const sales = this.getCustomerSales(customerId);
    const invoices = this.getCustomerInvoices(customerId);

    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const lastPurchaseDate =
      sales.length > 0
        ? sales.reduce((latest, sale) =>
            new Date(sale.saleDate) > new Date(latest.saleDate) ? sale : latest
          ).saleDate
        : null;

    const outstandingInvoices = invoices.filter(inv => inv.status !== 'PAID').length;

    return {
      customer,
      totalSales,
      totalAmount,
      lastPurchaseDate,
      outstandingInvoices,
    };
  }

  /**
   * Get merge history for a customer (shows what customers were merged into this one)
   */
  getMergeHistory(customerId: string): Array<{
    sourceCustomer: Customer | null;
    mergedAt: string;
    mergedByUserId: string | null;
  }> {
    const merges = this.customerMergeRepo.getByTargetCustomerId(customerId);

    return merges.map((merge: CustomerMerge) => ({
      sourceCustomer: this.customerRepo.getById(merge.sourceCustomerId),
      mergedAt: merge.mergedAt,
      mergedByUserId: merge.mergedByUserId,
    }));
  }

  /**
   * Check if a customer is a merged customer (deactivated after merge)
   */
  isMergedCustomer(customerId: string): boolean {
    const customer = this.customerRepo.getById(customerId);
    if (!customer) return false;

    // A merged customer is inactive + has a merge record where it's the source
    const merges = this.customerMergeRepo.getBySourceCustomerId(customerId);
    return !customer.isActive && merges.length > 0;
  }

  /**
   * Get the target customer if this was merged
   */
  getMergeTarget(customerId: string): Customer | null {
    const merges = this.customerMergeRepo.getBySourceCustomerId(customerId);
    if (merges.length === 0) return null;

    // Get the most recent merge
    const mostRecent = merges.sort(
      (a, b) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime()
    )[0];

    return this.customerRepo.getById(mostRecent.targetCustomerId);
  }
}

