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
    return this.queryAll(
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
    ).map((row) => ({
      date: row.date,
      totalSales: row.total_sales,
      totalRevenue: row.total_revenue,
      totalTrucks: row.total_trucks,
    }));
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
    return this.queryAll(
      `SELECT
        s.customer_id,
        c.name as customer_name,
        COUNT(*) as total_purchases,
        SUM(s.total_price) as total_amount
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       WHERE s.customer_id IS NOT NULL
         AND date(s.sale_date) BETWEEN ? AND ?
       GROUP BY s.customer_id
       ORDER BY total_amount DESC`,
      [startDate, endDate]
    ).map((row) => ({
      customerId: row.customer_id,
      customerName: row.customer_name,
      totalPurchases: row.total_purchases,
      totalAmount: row.total_amount,
    }));
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
}
