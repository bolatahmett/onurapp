import { getDatabase } from '../database/connection';
import {
  DailySummary,
  ProductSummary,
  CustomerSummary,
  TruckSummary,
} from '../../shared/types/entities';

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
}
