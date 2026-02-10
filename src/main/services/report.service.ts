import { getDatabase } from '../database/connection';
import {
  DailySummary,
  ProductSummary,
  CustomerSummary,
  TruckSummary,
  DebtAgingReport,
} from '../../shared/types/entities';
import { PaymentStatus } from '../../shared/types/enums';

export class ReportService {
  private queryAll(sql: string, params: any[] = []): any[] {
    const db = getDatabase();
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  getDailySummary(startDate: string, endDate: string): DailySummary[] {
    const summaries = this.queryAll(
      `SELECT
        date(sale_date) as date,
        COUNT(*) as total_sales,
        SUM(total_price) as total_revenue,
        COUNT(DISTINCT truck_id) as total_trucks
       FROM sales
       WHERE date(sale_date) BETWEEN ? AND ?
       GROUP BY date(sale_date)
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    // For each date, get truck breakdown
    return summaries.map((row) => {
      const date = row.date;
      const truckBreakdown = this.queryAll(
        `SELECT
          t.id as truck_id,
          t.plate_number,
          t.arrival_date,
          COALESCE(SUM(s.total_price), 0) as total_revenue,
          COUNT(s.id) as total_sales
         FROM trucks t
         LEFT JOIN sales s ON t.id = s.truck_id AND date(s.sale_date) = ?
         WHERE t.id IN (
           SELECT DISTINCT truck_id FROM sales WHERE date(sale_date) = ?
         )
         GROUP BY t.id`,
        [date, date]
      ).map(tr => ({
        truckId: tr.truck_id,
        plateNumber: tr.plate_number,
        arrivalDate: tr.arrival_date,
        totalSales: tr.total_sales,
        totalRevenue: tr.total_revenue,
      }));

      return {
        date: row.date,
        totalSales: row.total_sales,
        totalRevenue: row.total_revenue,
        totalTrucks: row.total_trucks,
        truckBreakdown,
      };
    });
  }

  getProductSummary(startDate: string, endDate: string): ProductSummary[] {
    return this.queryAll(
      `SELECT
        s.product_id,
        p.name as product_name,
        SUM(s.quantity) as total_quantity,
        SUM(s.total_price) as total_revenue,
        COUNT(*) as sale_count
       FROM sales s
       JOIN products p ON s.product_id = p.id
       WHERE date(s.sale_date) BETWEEN ? AND ?
       GROUP BY s.product_id
       ORDER BY total_revenue DESC`,
      [startDate, endDate]
    ).map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      totalQuantity: row.total_quantity,
      totalRevenue: row.total_revenue,
      saleCount: row.sale_count,
    }));
  }

  getCustomerSummary(startDate: string, endDate: string): CustomerSummary[] {
    const summaries = this.queryAll(
      `SELECT
        s.customer_id,
        c.name as customer_name,
        COUNT(*) as total_purchases,
        SUM(s.total_price) as total_amount,
        MAX(s.sale_date) as last_purchase_date
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       WHERE s.customer_id IS NOT NULL
         AND date(s.sale_date) BETWEEN ? AND ?
       GROUP BY s.customer_id
       ORDER BY total_amount DESC`,
      [startDate, endDate]
    );

    return summaries.map((row) => {
      // Count outstanding invoices for this customer
      const invoiceStats = this.queryAll(
        `SELECT COUNT(*) as outstanding_count
         FROM invoices
         WHERE customer_id = ? AND status IN ('DRAFT', 'ISSUED')`,
        [row.customer_id]
      );

      const outstandingCount = invoiceStats[0]?.outstanding_count || 0;

      return {
        customerId: row.customer_id,
        customerName: row.customer_name,
        totalPurchases: row.total_purchases,
        totalAmount: row.total_amount,
        outstandingInvoices: outstandingCount,
        lastPurchaseDate: row.last_purchase_date || null,
      };
    });
  }

  getTruckSummary(startDate: string, endDate: string): TruckSummary[] {
    return this.queryAll(
      `SELECT
        t.id as truck_id,
        t.plate_number,
        t.arrival_date,
        COUNT(s.id) as total_sales,
        COALESCE(SUM(s.total_price), 0) as total_revenue
       FROM trucks t
       LEFT JOIN sales s ON t.id = s.truck_id
       WHERE date(t.arrival_date) BETWEEN ? AND ?
       GROUP BY t.id
       ORDER BY t.arrival_date DESC`,
      [startDate, endDate]
    ).map((row) => ({
      truckId: row.truck_id,
      plateNumber: row.plate_number,
      arrivalDate: row.arrival_date,
      totalSales: row.total_sales,
      totalRevenue: row.total_revenue,
    }));
  }

  getRevenueByPeriod(
    period: 'daily' | 'weekly' | 'monthly',
    startDate: string,
    endDate: string
  ): { period: string; revenue: number; count: number }[] {
    let groupExpr: string;
    switch (period) {
      case 'daily': groupExpr = "date(sale_date)"; break;
      case 'weekly': groupExpr = "strftime('%Y-W%W', sale_date)"; break;
      case 'monthly': groupExpr = "strftime('%Y-%m', sale_date)"; break;
    }

    return this.queryAll(
      `SELECT
        ${groupExpr} as period,
        SUM(total_price) as revenue,
        COUNT(*) as count
       FROM sales
       WHERE date(sale_date) BETWEEN ? AND ?
       GROUP BY ${groupExpr}
       ORDER BY period DESC`,
      [startDate, endDate]
    ).map((row) => ({
      period: row.period,
      revenue: row.revenue,
      count: row.count,
    }));
  }

  getInvoiceStatus(): { status: string; count: number; totalAmount: number }[] {
    return this.queryAll(
      `SELECT
        status,
        COUNT(*) as count,
        COALESCE(SUM(net_total), 0) as total_amount
       FROM invoices
       GROUP BY status
       ORDER BY status ASC`
    ).map((row) => ({
      status: row.status,
      count: row.count,
      totalAmount: row.total_amount,
    }));
  }

  getRevenueSummary(startDate: string, endDate: string): {
    totalRevenue: number;
    invoiceCount: number;
    paidAmount: number;
    outstandingAmount: number;
    averageInvoiceValue: number;
  } {
    const result = this.queryAll(
      `SELECT
        COALESCE(SUM(CASE WHEN i.status = 'PAID' THEN i.net_total ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN i.status IN ('DRAFT', 'ISSUED') THEN i.net_total ELSE 0 END), 0) as outstanding_amount,
        COALESCE(SUM(i.subtotal), 0) as total_revenue,
        COUNT(*) as invoice_count
       FROM invoices i
       WHERE date(i.created_at) BETWEEN ? AND ?`,
      [startDate, endDate]
    )[0];

    const totalRevenue = result?.total_revenue || 0;
    const invoiceCount = result?.invoice_count || 0;
    const paidAmount = result?.paid_amount || 0;
    const outstandingAmount = result?.outstanding_amount || 0;

    return {
      totalRevenue,
      invoiceCount,
      paidAmount,
      outstandingAmount,
      averageInvoiceValue: invoiceCount > 0 ? totalRevenue / invoiceCount : 0,
    };
  }

  // =========================================================================
  // Debt & Aging Reports
  // =========================================================================

  /**
   * Get debt aging report across all customers
   * Groups outstanding balances by aging buckets: current, 1-30, 31-60, 61-90, 90+
   */
  getDebtAgingReport(): DebtAgingReport {
    const now = new Date();

    // Get all outstanding invoices with customer info and payment totals
    const invoices = this.queryAll(
      `SELECT
        i.id, i.invoice_number, i.customer_id, i.net_total, i.due_date, i.status, i.issue_date,
        c.name as customer_name, c.customer_type, c.credit_limit,
        COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as total_paid
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       WHERE i.status IN ('DRAFT', 'ISSUED')
       ORDER BY c.name, i.due_date ASC`
    );

    let totalOutstanding = 0;
    let totalOverdue = 0;
    let currentDue = 0;
    let overdue1to30 = 0;
    let overdue31to60 = 0;
    let overdue61to90 = 0;
    let overdue90Plus = 0;

    // Group by customer
    const customerMap = new Map<string, {
      customerId: string;
      customerName: string;
      customerType: string;
      creditLimit: number | null;
      totalInvoiced: number;
      totalPaid: number;
      totalOutstanding: number;
      currentDue: number;
      overdue1to30: number;
      overdue31to60: number;
      overdue61to90: number;
      overdue90Plus: number;
      hasOverdue: boolean;
    }>();

    for (const row of invoices) {
      const remaining = Math.max(0, row.net_total - row.total_paid);
      if (remaining <= 0.01) continue;

      totalOutstanding += remaining;

      // Calculate overdue days
      let daysOverdue = 0;
      let isOverdue = false;
      if (row.due_date) {
        const dueDate = new Date(row.due_date);
        if (now > dueDate) {
          daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          isOverdue = true;
        }
      }

      // Categorize into aging buckets
      if (!isOverdue) {
        currentDue += remaining;
      } else if (daysOverdue <= 30) {
        overdue1to30 += remaining;
        totalOverdue += remaining;
      } else if (daysOverdue <= 60) {
        overdue31to60 += remaining;
        totalOverdue += remaining;
      } else if (daysOverdue <= 90) {
        overdue61to90 += remaining;
        totalOverdue += remaining;
      } else {
        overdue90Plus += remaining;
        totalOverdue += remaining;
      }

      // Accumulate per customer
      if (!customerMap.has(row.customer_id)) {
        customerMap.set(row.customer_id, {
          customerId: row.customer_id,
          customerName: row.customer_name,
          customerType: row.customer_type,
          creditLimit: row.credit_limit,
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          currentDue: 0,
          overdue1to30: 0,
          overdue31to60: 0,
          overdue61to90: 0,
          overdue90Plus: 0,
          hasOverdue: false,
        });
      }

      const cust = customerMap.get(row.customer_id)!;
      cust.totalInvoiced += row.net_total;
      cust.totalPaid += row.total_paid;
      cust.totalOutstanding += remaining;

      if (!isOverdue) {
        cust.currentDue += remaining;
      } else if (daysOverdue <= 30) {
        cust.overdue1to30 += remaining;
        cust.hasOverdue = true;
      } else if (daysOverdue <= 60) {
        cust.overdue31to60 += remaining;
        cust.hasOverdue = true;
      } else if (daysOverdue <= 90) {
        cust.overdue61to90 += remaining;
        cust.hasOverdue = true;
      } else {
        cust.overdue90Plus += remaining;
        cust.hasOverdue = true;
      }
    }

    // Build customer debt summaries
    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
      .map(c => ({
        customerId: c.customerId,
        customerName: c.customerName,
        customerType: c.customerType as any,
        creditLimit: c.creditLimit,
        totalInvoiced: c.totalInvoiced,
        totalPaid: c.totalPaid,
        totalOutstanding: c.totalOutstanding,
        totalInvoiceCount: 0, // will be filled if needed
        paidInvoiceCount: 0,
        partiallyPaidInvoiceCount: 0,
        unpaidInvoiceCount: 0,
        overdueInvoiceCount: 0,
        currentDue: c.currentDue,
        overdue1to30: c.overdue1to30,
        overdue31to60: c.overdue31to60,
        overdue61to90: c.overdue61to90,
        overdue90Plus: c.overdue90Plus,
        availableCredit: c.creditLimit !== null
          ? Math.max(0, c.creditLimit - c.totalOutstanding)
          : null,
        isOverCreditLimit: c.creditLimit !== null
          ? c.totalOutstanding > c.creditLimit
          : false,
        lastInvoiceDate: null,
        lastPaymentDate: null,
        invoices: [],
      }));

    const overdueCustomerCount = Array.from(customerMap.values()).filter(c => c.hasOverdue).length;

    return {
      totalOutstanding,
      totalOverdue,
      currentDue,
      overdue1to30,
      overdue31to60,
      overdue61to90,
      overdue90Plus,
      customerCount: customerMap.size,
      overdueCustomerCount,
      customers,
    };
  }

  /**
   * Get customer payment performance report
   * Shows payment behavior: average days to pay, on-time percentage etc.
   */
  getCustomerPaymentPerformance(): Array<{
    customerId: string;
    customerName: string;
    totalInvoices: number;
    paidInvoices: number;
    avgDaysToPay: number | null;
    onTimePaymentRate: number;
    totalOutstanding: number;
    totalOverdue: number;
  }> {
    const rows = this.queryAll(
      `SELECT
        c.id as customer_id,
        c.name as customer_name,
        COUNT(i.id) as total_invoices,
        SUM(CASE WHEN i.status = 'PAID' THEN 1 ELSE 0 END) as paid_invoices,
        AVG(CASE
          WHEN i.status = 'PAID' AND i.issue_date IS NOT NULL AND i.payment_received_date IS NOT NULL
          THEN julianday(i.payment_received_date) - julianday(i.issue_date)
          ELSE NULL
        END) as avg_days_to_pay,
        SUM(CASE
          WHEN i.status = 'PAID' AND i.due_date IS NOT NULL AND i.payment_received_date IS NOT NULL
               AND i.payment_received_date <= i.due_date THEN 1
          WHEN i.status = 'PAID' AND i.due_date IS NULL THEN 1
          ELSE 0
        END) as on_time_count
       FROM customers c
       JOIN invoices i ON c.id = i.customer_id
       WHERE i.status != 'CANCELLED'
       GROUP BY c.id
       HAVING total_invoices > 0
       ORDER BY c.name`
    );

    return rows.map(row => {
      // Get outstanding amounts
      const outstanding = this.queryAll(
        `SELECT
          COALESCE(SUM(i.net_total - COALESCE(
            (SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0
          )), 0) as total_outstanding,
          COALESCE(SUM(CASE
            WHEN i.due_date IS NOT NULL AND date(i.due_date) < date('now')
            THEN i.net_total - COALESCE(
              (SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0
            )
            ELSE 0
          END), 0) as total_overdue
         FROM invoices i
         WHERE i.customer_id = ? AND i.status IN ('DRAFT', 'ISSUED')`,
        [row.customer_id]
      )[0];

      const paidInvoices = row.paid_invoices || 0;
      const onTimeCount = row.on_time_count || 0;

      return {
        customerId: row.customer_id,
        customerName: row.customer_name,
        totalInvoices: row.total_invoices,
        paidInvoices,
        avgDaysToPay: row.avg_days_to_pay !== null ? Math.round(row.avg_days_to_pay) : null,
        onTimePaymentRate: paidInvoices > 0 ? (onTimeCount / paidInvoices) * 100 : 0,
        totalOutstanding: Math.max(0, outstanding?.total_outstanding || 0),
        totalOverdue: Math.max(0, outstanding?.total_overdue || 0),
      };
    });
  }

  /**
   * Get collection summary (tahsilat özeti)
   * Shows total collected vs. total outstanding per period
   */
  getCollectionSummary(startDate: string, endDate: string): {
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    paymentsByMethod: Array<{ method: string; amount: number; count: number }>;
    dailyCollections: Array<{ date: string; amount: number; count: number }>;
  } {
    // Total collected in period
    const collected = this.queryAll(
      `SELECT
        COALESCE(SUM(amount), 0) as total_collected
       FROM payments
       WHERE date(paid_date) BETWEEN ? AND ?`,
      [startDate, endDate]
    )[0];

    // Total outstanding
    const outstanding = this.queryAll(
      `SELECT
        COALESCE(SUM(i.net_total - COALESCE(
          (SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0
        )), 0) as total_outstanding
       FROM invoices i
       WHERE i.status IN ('DRAFT', 'ISSUED')`
    )[0];

    // Payments by method
    const paymentsByMethod = this.queryAll(
      `SELECT
        method,
        SUM(amount) as amount,
        COUNT(*) as count
       FROM payments
       WHERE date(paid_date) BETWEEN ? AND ?
       GROUP BY method
       ORDER BY amount DESC`,
      [startDate, endDate]
    ).map(row => ({
      method: row.method || 'OTHER',
      amount: row.amount,
      count: row.count,
    }));

    // Daily collections
    const dailyCollections = this.queryAll(
      `SELECT
        date(paid_date) as date,
        SUM(amount) as amount,
        COUNT(*) as count
       FROM payments
       WHERE date(paid_date) BETWEEN ? AND ?
       GROUP BY date(paid_date)
       ORDER BY date DESC`,
      [startDate, endDate]
    ).map(row => ({
      date: row.date,
      amount: row.amount,
      count: row.count,
    }));

    const totalCollected = collected?.total_collected || 0;
    const totalOutstanding = Math.max(0, outstanding?.total_outstanding || 0);
    const totalInvoiced = totalCollected + totalOutstanding;
    const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

    return {
      totalCollected,
      totalOutstanding,
      collectionRate,
      paymentsByMethod,
      dailyCollections,
    };
  }
}
