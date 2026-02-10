import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield, TrendingUp, Users, Package, Truck, CreditCard,
  DollarSign, Download, Calendar, ArrowUpRight, ArrowDownRight,
  Percent, Info, ChevronRight, FileText, PieChart, BarChart3
} from 'lucide-react';
import { RevenueChart } from '../components/reports/RevenueChart';
import { TruckDrilldown } from '../components/reports/TruckDrilldown';
import { useIpc } from '../hooks/useIpc';
import { DataTable } from '../components/common/DataTable';
import { formatCurrency, formatDate, todayISO, daysAgoISO } from '../utils/formatters';
import type { DailySummary, ProductSummary, CustomerSummary, TruckSummary } from '@shared/types/entities';

type ReportTab = 'overview' | 'product' | 'customer' | 'truck' | 'debtAging' | 'collections';

export function Reports() {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillTruckId, setDrillTruckId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [startDate, setStartDate] = useState(daysAgoISO(30));
  const [endDate, setEndDate] = useState(todayISO());

  // Generalized Data Hooks (using the { success, data } pattern)
  const { data: dailyRes, loading: dailyLoading } = useIpc<any>(
    () => window.api.report.getDailySummary(startDate, endDate),
    [startDate, endDate]
  );

  const dailyData = useMemo(() => {
    const raw = dailyRes?.success ? dailyRes.data : [];
    return (raw ?? []).map((d: any) => ({ ...d, id: d.date }));
  }, [dailyRes]);

  const { data: productRes, loading: productLoading } = useIpc<any>(
    () => window.api.report.getProductSummary(startDate, endDate),
    [startDate, endDate]
  );

  const productData = useMemo(() => {
    const raw = productRes?.success ? productRes.data : [];
    return (raw ?? []).map((d: any) => ({ ...d, id: d.productId }));
  }, [productRes]);

  const { data: customerRes, loading: customerLoading } = useIpc<any>(
    () => window.api.report.getCustomerSummary(startDate, endDate),
    [startDate, endDate]
  );

  const customerData = useMemo(() => {
    const raw = customerRes?.success ? customerRes.data : [];
    return (raw ?? []).map((d: any) => ({ ...d, id: d.customerId }));
  }, [customerRes]);

  const { data: truckRes, loading: truckLoading } = useIpc<any>(
    () => window.api.report.getTruckSummary(startDate, endDate),
    [startDate, endDate]
  );

  const truckData = useMemo(() => {
    const raw = truckRes?.success ? truckRes.data : [];
    return (raw ?? []).map((d: any) => ({ ...d, id: d.truckId }));
  }, [truckRes]);

  const { data: debtAgingResult, loading: debtAgingLoading } = useIpc<any>(
    () => window.api.report.getDebtAging()
  );

  const { data: revenueResult, loading: revenueLoading } = useIpc<any>(
    () => window.api.report.getRevenueSummary(startDate, endDate),
    [startDate, endDate]
  );

  const { data: collectionResult, loading: collectionLoading } = useIpc<any>(
    () => window.api.report.getCollectionSummary(startDate, endDate),
    [startDate, endDate]
  );

  const { data: payPerformanceResult, loading: perfLoading } = useIpc<any>(
    () => window.api.report.getPaymentPerformance(),
    []
  );

  const payPerformance = useMemo(() => {
    const rawData = payPerformanceResult?.success ? payPerformanceResult.data : [];
    return (rawData ?? []).map((d: any) => ({ ...d, id: d.customerId }));
  }, [payPerformanceResult]);

  // Summaries
  const summaryData = revenueResult?.success ? revenueResult.data : null;
  const collSummary = collectionResult?.success ? collectionResult.data : null;
  const debtAgingData = debtAgingResult?.success ? debtAgingResult.data : null;

  // Tabs Configuration
  const tabs: { key: ReportTab; label: string; icon: any }[] = [
    { key: 'overview', label: t('reports.overview'), icon: TrendingUp },
    { key: 'product', label: t('reports.productReport'), icon: Package },
    { key: 'customer', label: t('reports.customerReport'), icon: Users },
    { key: 'truck', label: t('reports.truckReport'), icon: Truck },
    { key: 'collections', label: t('reports.collections'), icon: CreditCard },
    { key: 'debtAging', label: t('reports.debtAging'), icon: Shield },
  ];

  // Table Columns
  const dailyColumns = [
    { key: 'date', header: t('common.date'), render: (item: any) => formatDate(item.date) },
    { key: 'totalSales', header: t('reports.salesCount') },
    { key: 'totalTrucks', header: t('dashboard.activeTrucks') },
    {
      key: 'totalRevenue',
      header: t('reports.revenue'),
      render: (item: any) => <span className="font-semibold text-primary-700">{formatCurrency(item.totalRevenue)}</span>,
    },
  ];

  const productColumns = [
    { key: 'productName', header: t('sales.product') },
    { key: 'saleCount', header: t('reports.salesCount') },
    { key: 'totalQuantity', header: t('sales.quantity') },
    {
      key: 'totalRevenue',
      header: t('reports.revenue'),
      render: (item: any) => <span className="font-semibold text-emerald-700">{formatCurrency(item.totalRevenue)}</span>,
    },
  ];

  const customerColumns = [
    { key: 'customerName', header: t('sales.customer') },
    { key: 'totalPurchases', header: t('customers.totalPurchases') },
    {
      key: 'totalAmount',
      header: t('common.total'),
      render: (item: any) => <span className="font-semibold text-indigo-700">{formatCurrency(item.totalAmount)}</span>,
    },
    { key: 'outstandingInvoices', header: t('dashboard.overdueInvoices') },
  ];

  const truckColumns = [
    { key: 'plateNumber', header: t('trucks.plateNumber') },
    {
      key: 'arrivalDate',
      header: t('trucks.arrivalDate'),
      render: (item: any) => formatDate(item.arrivalDate),
    },
    { key: 'totalSales', header: t('reports.salesCount') },
    {
      key: 'totalRevenue',
      header: t('reports.revenue'),
      render: (item: any) => <span className="font-semibold text-orange-700">{formatCurrency(item.totalRevenue)}</span>,
    },
  ];

  const perfColumns = [
    { key: 'customerName', header: t('sales.customer') },
    { key: 'totalInvoices', header: t('reports.invoiceCount') },
    {
      key: 'avgDaysToPay',
      header: t('reports.avgDaysToPay'),
      render: (item: any) => item.avgDaysToPay !== null ? `${item.avgDaysToPay} ${t('reports.daily')}` : '-'
    },
    {
      key: 'onTimePaymentRate',
      header: t('reports.onTimeRate'),
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${item.onTimePaymentRate > 80 ? 'bg-green-500' : item.onTimePaymentRate > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${item.onTimePaymentRate}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium">{item.onTimePaymentRate.toFixed(0)}%</span>
        </div>
      )
    },
  ];

  const collectionColumns = [
    { key: 'date', header: t('common.date'), render: (item: any) => formatDate(item.date) },
    { key: 'count', header: t('reports.salesCount') },
    {
      key: 'amount',
      header: t('reports.revenue'),
      render: (item: any) => <span className="font-semibold text-green-700">{formatCurrency(item.amount)}</span>,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <BarChart3 className="text-primary-600" />
          {t('reports.title')}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            <input
              type="date"
              className="bg-transparent border-none text-sm px-2 py-1 outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="self-center px-1 text-gray-400"><Calendar size={14} /></span>
            <input
              type="date"
              className="bg-transparent border-none text-sm px-2 py-1 outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium shadow-sm hover:shadow"
            onClick={async () => {
              try {
                setExporting(true);
                let res: any = null;
                if (activeTab === 'overview') res = await window.api.export.exportDailyReportPdf(startDate, endDate);
                else if (activeTab === 'product') res = await window.api.export.exportProductReportPdf(startDate, endDate);
                else if (activeTab === 'customer') res = await window.api.export.exportCustomerReportPdf(startDate, endDate);
                else res = await window.api.export.exportDailyReportPdf(startDate, endDate);

                if (res?.success) {
                  window.api.export.openPdf(res.filepath);
                }
              } catch (err: any) {
                console.error(err);
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
          >
            <Download size={18} className={exporting ? 'animate-bounce' : ''} />
            {exporting ? t('reports.exporting') : t('reports.exportPdf')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shadow-sm border ${activeTab === tab.key
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="space-y-6 animate-in fade-in duration-300">
        {activeTab === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: t('reports.totalRevenue'), value: formatCurrency(summaryData?.totalRevenue ?? 0), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { title: t('reports.totalPaid'), value: formatCurrency(summaryData?.paidAmount ?? 0), icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: t('reports.outstandingAmount'), value: formatCurrency(summaryData?.outstandingAmount ?? 0), icon: ArrowUpRight, color: 'text-red-600', bg: 'bg-red-50' },
                { title: t('reports.avgInvoiceValue'), value: formatCurrency(summaryData?.averageInvoiceValue ?? 0), icon: Info, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              ].map((card, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                      <card.icon size={24} />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.title}</span>
                  </div>
                  <div className="mt-2">
                    <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary-500" />
                    {t('reports.revenueChart')}
                  </h3>
                </div>
                <div className="h-64">
                  <RevenueChart
                    data={dailyData}
                    onBarClick={(date) => { setStartDate(date); setEndDate(date); }}
                  />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Package size={18} className="text-orange-500" />
                  {t('reports.productReport')}
                </h3>
                <div className="space-y-4 max-h-64 overflow-y-auto no-scrollbar">
                  {productData.slice(0, 8).map((prod, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 transition-colors group-hover:bg-primary-50 group-hover:text-primary-600">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{prod.productName}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(prod.totalRevenue)}</span>
                    </div>
                  ))}
                  {(!productData || productData.length === 0) && (
                    <p className="text-center text-gray-400 py-12 text-sm">{t('common.noData')}</p>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50">
                  <button onClick={() => setActiveTab('product')} className="text-sm font-semibold text-primary-600 flex items-center gap-1 hover:gap-2 transition-all">
                    {t('common.all')} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">{t('reports.dailySummary')}</h3>
              </div>
              <DataTable columns={dailyColumns} data={dailyData} loading={dailyLoading} />
            </div>
          </>
        )}

        {activeTab === 'product' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <DataTable columns={productColumns} data={productData} loading={productLoading} />
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="font-bold text-gray-800">{t('reports.customerReport')}</h3>
              </div>
              <DataTable columns={customerColumns} data={customerData} loading={customerLoading} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <CreditCard size={18} className="text-indigo-500" />
                  {t('reports.paymentPerformance')}
                </h3>
              </div>
              <DataTable columns={perfColumns} data={payPerformance} loading={perfLoading} />
            </div>
          </div>
        )}

        {activeTab === 'truck' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <DataTable
              columns={[...truckColumns, {
                key: 'actions', header: t('common.actions'), className: 'text-right', render: (item: any) => (
                  <button
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    onClick={() => { setDrillTruckId(item.truckId); setDrillOpen(true); }}
                  >
                    {t('reports.viewSales')}
                    <ChevronRight size={16} />
                  </button>
                )
              }]}
              data={truckData}
              loading={truckLoading}
            />
            <TruckDrilldown open={drillOpen} truckId={drillTruckId} onClose={() => setDrillOpen(false)} />
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: t('reports.totalCollected'), value: formatCurrency(collSummary?.totalCollected ?? 0), icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { title: t('reports.collectionRate'), value: `${(collSummary?.collectionRate ?? 0).toFixed(1)}%`, icon: Percent, color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: t('reports.totalOutstanding'), value: formatCurrency(collSummary?.totalOutstanding ?? 0), icon: Info, color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map((card, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${card.bg} ${card.color}`}>
                      <card.icon size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">{card.title}</p>
                      <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">{t('reports.dailyCollections')}</h3>
                </div>
                <DataTable columns={collectionColumns} data={(collSummary?.dailyCollections ?? []).map((d: any) => ({ ...d, id: d.date }))} loading={collectionLoading} />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-6">{t('reports.paymentsByMethod')}</h3>
                <div className="space-y-6">
                  {(collSummary?.paymentsByMethod ?? []).map((method: any) => (
                    <div key={method.method} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-600">{t(`payments.${method.method}`)}</span>
                        <span className="font-bold text-gray-900">{formatCurrency(method.amount)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(method.amount / (collSummary?.totalCollected || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {(!collSummary?.paymentsByMethod || collSummary.paymentsByMethod.length === 0) && (
                    <p className="text-center text-gray-400 py-12 text-sm">{t('common.noData')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'debtAging' && (
          debtAgingLoading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
              <div className="animate-spin text-primary-600 mb-4"><RefreshCw size={32} /></div>
              <p className="text-gray-500 font-medium">{t('common.loading')}</p>
            </div>
          ) : debtAgingData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-l-4 border-l-red-500 shadow-sm">
                  <p className="text-sm font-medium text-gray-400 mb-1">{t('reports.totalOutstanding')}</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(debtAgingData.totalOutstanding)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-l-4 border-l-orange-500 shadow-sm">
                  <p className="text-sm font-medium text-gray-400 mb-1">{t('reports.totalOverdue')}</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(debtAgingData.totalOverdue)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-l-4 border-l-blue-500 shadow-sm">
                  <p className="text-sm font-medium text-gray-400 mb-1">{t('reports.customersWithDebt')}</p>
                  <p className="text-2xl font-bold text-blue-600">{debtAgingData.customerCount}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-l-4 border-l-emerald-500 shadow-sm">
                  <p className="text-sm font-medium text-gray-400 mb-1">{t('reports.current')}</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(debtAgingData.currentDue)}</p>
                </div>
              </div>

              {/* Aging Breakdown */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: t('reports.overdue1to30'), amount: debtAgingData.overdue1to30, color: 'bg-yellow-50 text-yellow-700', border: 'border-yellow-200' },
                  { label: t('reports.overdue31to60'), amount: debtAgingData.overdue31to60, color: 'bg-orange-50 text-orange-700', border: 'border-orange-200' },
                  { label: t('reports.overdue61to90'), amount: debtAgingData.overdue61to90, color: 'bg-red-50 text-red-700', border: 'border-red-200' },
                  { label: t('reports.overdue90Plus'), amount: debtAgingData.overdue90Plus, color: 'bg-red-100 text-red-800', border: 'border-red-300' },
                ].map((bucket, i) => (
                  <div key={i} className={`${bucket.color} ${bucket.border} border rounded-xl p-4 text-center transition-transform hover:scale-105`}>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">{bucket.label}</p>
                    <p className="text-lg font-black">{formatCurrency(bucket.amount)}</p>
                  </div>
                ))}
              </div>

              {/* Customer Debt Table */}
              {debtAgingData.customers && debtAgingData.customers.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h4 className="font-bold text-gray-800">{t('reports.customersWithDebt')}</h4>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-[500px] overflow-auto no-scrollbar">
                    {debtAgingData.customers.map((cust: any) => (
                      <div key={cust.customerId} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                            {cust.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{cust.customerName}</p>
                            <p className="text-xs text-gray-400">{cust.customerType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600 text-lg">{formatCurrency(cust.totalOutstanding)}</p>
                          {cust.hasOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase tracking-tighter">
                              <Info size={10} /> {t('invoices.paymentStatus.OVERDUE')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
              <FileText size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">{t('common.noData')}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

const RefreshCw = ({ size, className }: { size?: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
  </svg>
);
