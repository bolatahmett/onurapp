import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useIpc } from '../hooks/useIpc';
import { DataTable } from '../components/common/DataTable';
import { formatCurrency, formatDate, todayISO, daysAgoISO } from '../utils/formatters';
import type { DailySummary, ProductSummary, CustomerSummary, TruckSummary } from '@shared/types/entities';

type ReportTab = 'daily' | 'product' | 'customer' | 'truck';

export function Reports() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ReportTab>('daily');
  const [startDate, setStartDate] = useState(daysAgoISO(30));
  const [endDate, setEndDate] = useState(todayISO());

  const { data: dailyData, loading: dailyLoading } = useIpc<DailySummary[]>(
    () => window.api.report.dailySummary(startDate, endDate),
    [startDate, endDate]
  );
  const { data: productData, loading: productLoading } = useIpc<ProductSummary[]>(
    () => window.api.report.productSummary(startDate, endDate),
    [startDate, endDate]
  );
  const { data: customerData, loading: customerLoading } = useIpc<CustomerSummary[]>(
    () => window.api.report.customerSummary(startDate, endDate),
    [startDate, endDate]
  );
  const { data: truckData, loading: truckLoading } = useIpc<TruckSummary[]>(
    () => window.api.report.truckSummary(startDate, endDate),
    [startDate, endDate]
  );

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'daily', label: t('reports.dailySummary') },
    { key: 'product', label: t('reports.productReport') },
    { key: 'customer', label: t('reports.customerReport') },
    { key: 'truck', label: t('reports.truckReport') },
  ];

  const dailyColumns = [
    { key: 'date', header: t('common.date'), render: (item: DailySummary) => formatDate(item.date) },
    { key: 'totalSales', header: t('reports.salesCount') },
    { key: 'totalTrucks', header: t('dashboard.activeTrucks') },
    {
      key: 'totalRevenue',
      header: t('reports.revenue'),
      render: (item: DailySummary) => <span className="font-semibold">{formatCurrency(item.totalRevenue)}</span>,
    },
  ];

  const productColumns = [
    { key: 'productName', header: t('sales.product') },
    { key: 'saleCount', header: t('reports.salesCount') },
    { key: 'totalQuantity', header: t('sales.quantity') },
    {
      key: 'totalRevenue',
      header: t('reports.revenue'),
      render: (item: ProductSummary) => <span className="font-semibold">{formatCurrency(item.totalRevenue)}</span>,
    },
  ];

  const customerColumns = [
    { key: 'customerName', header: t('sales.customer') },
    { key: 'totalPurchases', header: t('customers.totalPurchases') },
    {
      key: 'totalAmount',
      header: t('common.total'),
      render: (item: CustomerSummary) => <span className="font-semibold">{formatCurrency(item.totalAmount)}</span>,
    },
  ];

  const truckColumns = [
    { key: 'plateNumber', header: t('trucks.plateNumber') },
    {
      key: 'arrivalDate',
      header: t('trucks.arrivalDate'),
      render: (item: TruckSummary) => formatDate(item.arrivalDate),
    },
    { key: 'totalSales', header: t('reports.salesCount') },
    {
      key: 'totalRevenue',
      header: t('reports.revenue'),
      render: (item: TruckSummary) => <span className="font-semibold">{formatCurrency(item.totalRevenue)}</span>,
    },
  ];

  const getTotalRevenue = () => {
    switch (activeTab) {
      case 'daily': return (dailyData ?? []).reduce((s, d) => s + d.totalRevenue, 0);
      case 'product': return (productData ?? []).reduce((s, d) => s + d.totalRevenue, 0);
      case 'customer': return (customerData ?? []).reduce((s, d) => s + d.totalAmount, 0);
      case 'truck': return (truckData ?? []).reduce((s, d) => s + d.totalRevenue, 0);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="page-title">{t('reports.title')}</h2>

      {/* Date Range */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">{t('reports.startDate')}</label>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('reports.endDate')}</label>
            <input
              type="date"
              className="input-field"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="pt-6">
            <span className="text-sm text-gray-500">{t('common.total')}: </span>
            <span className="text-xl font-bold text-primary-700">{formatCurrency(getTotalRevenue())}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="card">
        {activeTab === 'daily' && (
          <DataTable columns={dailyColumns} data={dailyData ?? []} loading={dailyLoading} />
        )}
        {activeTab === 'product' && (
          <DataTable columns={productColumns} data={productData ?? []} loading={productLoading} />
        )}
        {activeTab === 'customer' && (
          <DataTable columns={customerColumns} data={customerData ?? []} loading={customerLoading} />
        )}
        {activeTab === 'truck' && (
          <DataTable columns={truckColumns} data={truckData ?? []} loading={truckLoading} />
        )}
      </div>
    </div>
  );
}
