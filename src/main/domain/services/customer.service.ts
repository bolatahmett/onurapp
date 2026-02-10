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
  CustomerDebtSummary,
  InvoicePaymentSummary,
} from '../../../shared/types/entities';
import { InvoiceStatus, PaymentStatus } from '../../../shared/types/enums';
import { auditService } from '../../services/AuditService';
import { CustomerRepository } from '../../repositories/customer.repository';
import { CustomerMergeRepository } from '../../repositories/customer-merge.repository';
import { SaleRepository } from '../../repositories/sale.repository';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { PaymentRepository } from '../../repositories/payment.repository';

export class CustomerService {
  private paymentRepo: PaymentRepository;

  constructor(
    private customerRepo: CustomerRepository,
    private customerMergeRepo: CustomerMergeRepository,
    private saleRepo: SaleRepository,
    private invoiceRepo: InvoiceRepository,
    paymentRepo?: PaymentRepository
  ) {
    this.paymentRepo = paymentRepo || new PaymentRepository();
  }

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
      auditService.log('Customer', customer.id, 'CREATE', null, JSON.stringify({
        name: customer.name,
        isTemporary: customer.isTemporary,
      }));

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
      auditService.log('Customer', customerId, 'UPDATE', null, JSON.stringify({
        before: current.name,
        after: updated.name,
        dto
      }));

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
      auditService.log('Customer', sourceCustomerId, 'UPDATE', null, JSON.stringify({
        isActive: false,
        reason: 'MERGE'
      }));

      auditService.log(
        'CustomerMerge',
        merge.id,
        'MERGE',
        null,
        JSON.stringify({
          sourceCustomerId,
          targetCustomerId,
          saleCount: sourceSales.length,
          invoiceCount: sourceInvoices.length,
        })
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
   * Get customer purchase summary with debt information
   */
  getCustomerSummary(customerId: string): {
    customer: Customer;
    totalSales: number;
    totalAmount: number;
    lastPurchaseDate: string | null;
    outstandingInvoices: number;
    // Debt tracking
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
    availableCredit: number | null;
    isOverCreditLimit: boolean;
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

    const outstandingInvoices = invoices.filter(
      inv => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED
    ).length;

    // Calculate debt info
    let totalInvoiced = 0;
    let totalPaid = 0;
    let overdueAmount = 0;
    const now = new Date();

    for (const invoice of invoices) {
      if (invoice.status === InvoiceStatus.CANCELLED) continue;

      totalInvoiced += invoice.netTotal;
      const invoicePaid = this.paymentRepo.getTotalPaid(invoice.id);
      totalPaid += invoicePaid;

      const remaining = Math.max(0, invoice.netTotal - invoicePaid);
      if (invoice.dueDate && new Date(invoice.dueDate) < now && remaining > 0.01) {
        overdueAmount += remaining;
      }
    }

    const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);
    const availableCredit = customer.creditLimit !== null
      ? Math.max(0, customer.creditLimit - totalOutstanding)
      : null;
    const isOverCreditLimit = customer.creditLimit !== null
      ? totalOutstanding > customer.creditLimit
      : false;

    return {
      customer,
      totalSales,
      totalAmount,
      lastPurchaseDate,
      outstandingInvoices,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      overdueAmount,
      availableCredit,
      isOverCreditLimit,
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

  // =========================================================================
  // Customer Debt & Balance Tracking
  // =========================================================================

  /**
   * Get outstanding balance for a customer (quick calculation)
   */
  getCustomerBalance(customerId: string): {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
  } {
    const invoices = this.invoiceRepo.getByCustomerId(customerId);
    const now = new Date();

    let totalInvoiced = 0;
    let totalPaid = 0;
    let overdueAmount = 0;

    for (const invoice of invoices) {
      if (invoice.status === InvoiceStatus.CANCELLED) continue;

      totalInvoiced += invoice.netTotal;
      const invoicePaid = this.paymentRepo.getTotalPaid(invoice.id);
      totalPaid += invoicePaid;

      const remaining = Math.max(0, invoice.netTotal - invoicePaid);
      if (invoice.dueDate && new Date(invoice.dueDate) < now && remaining > 0.01) {
        overdueAmount += remaining;
      }
    }

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding: Math.max(0, totalInvoiced - totalPaid),
      overdueAmount,
    };
  }

  /**
   * Get invoice payment statuses for a customer
   * Shows each invoice with: ödendi / kısmi ödendi / ödenmedi / vadesi geçmiş
   */
  getCustomerInvoiceStatuses(customerId: string): InvoicePaymentSummary[] {
    const invoices = this.invoiceRepo.getByCustomerId(customerId);
    const now = new Date();

    return invoices
      .filter(inv => inv.status !== InvoiceStatus.CANCELLED)
      .map(invoice => {
        const totalPaid = this.paymentRepo.getTotalPaid(invoice.id);
        const remainingBalance = Math.max(0, invoice.netTotal - totalPaid);

        let paymentStatus: PaymentStatus;
        let isOverdue = false;

        if (invoice.status === InvoiceStatus.PAID || remainingBalance <= 0.01) {
          paymentStatus = PaymentStatus.PAID;
        } else if (invoice.dueDate && new Date(invoice.dueDate) < now && remainingBalance > 0.01) {
          paymentStatus = PaymentStatus.OVERDUE;
          isOverdue = true;
        } else if (totalPaid > 0) {
          paymentStatus = PaymentStatus.PARTIAL;
        } else {
          paymentStatus = PaymentStatus.UNPAID;
        }

        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          netTotal: invoice.netTotal,
          totalPaid,
          remainingBalance,
          paymentStatus,
          isOverdue,
        };
      });
  }

  /**
   * Get all customers with outstanding debt (borcu olan müşteriler)
   */
  getCustomersWithDebt(): Array<{
    customer: Customer;
    totalOutstanding: number;
    overdueAmount: number;
    invoiceCount: number;
    overdueInvoiceCount: number;
  }> {
    const customers = this.customerRepo.getActive();
    const now = new Date();
    const result: Array<{
      customer: Customer;
      totalOutstanding: number;
      overdueAmount: number;
      invoiceCount: number;
      overdueInvoiceCount: number;
    }> = [];

    for (const customer of customers) {
      const invoices = this.invoiceRepo.getByCustomerId(customer.id);
      let totalOutstanding = 0;
      let overdueAmount = 0;
      let invoiceCount = 0;
      let overdueInvoiceCount = 0;

      for (const invoice of invoices) {
        if (invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.PAID) continue;

        const paid = this.paymentRepo.getTotalPaid(invoice.id);
        const remaining = Math.max(0, invoice.netTotal - paid);

        if (remaining > 0.01) {
          totalOutstanding += remaining;
          invoiceCount++;

          if (invoice.dueDate && new Date(invoice.dueDate) < now) {
            overdueAmount += remaining;
            overdueInvoiceCount++;
          }
        }
      }

      if (totalOutstanding > 0.01) {
        result.push({
          customer,
          totalOutstanding,
          overdueAmount,
          invoiceCount,
          overdueInvoiceCount,
        });
      }
    }

    // Sort by total outstanding descending
    result.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
    return result;
  }

  /**
   * Get customers who are over their credit limit
   */
  getCustomersOverCreditLimit(): Array<{
    customer: Customer;
    creditLimit: number;
    totalOutstanding: number;
    overLimitAmount: number;
  }> {
    const customers = this.customerRepo.getActive();
    const result: Array<{
      customer: Customer;
      creditLimit: number;
      totalOutstanding: number;
      overLimitAmount: number;
    }> = [];

    for (const customer of customers) {
      if (customer.creditLimit === null) continue;

      const balance = this.getCustomerBalance(customer.id);

      if (balance.totalOutstanding > customer.creditLimit) {
        result.push({
          customer,
          creditLimit: customer.creditLimit,
          totalOutstanding: balance.totalOutstanding,
          overLimitAmount: balance.totalOutstanding - customer.creditLimit,
        });
      }
    }

    result.sort((a, b) => b.overLimitAmount - a.overLimitAmount);
    return result;
  }
}

