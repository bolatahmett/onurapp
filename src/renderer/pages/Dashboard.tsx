import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Truck, Users, TrendingUp, Plus, AlertCircle } from 'lucide-react';
import { useIpc } from '../hooks/useIpc';
import { formatCurrency, formatDateTime, todayISO } from '../utils/formatters';
import type { SaleWithDetails } from '@shared/types/entities';
import type { Truck as TruckType } from '@shared/types/entities';

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: sales } = useIpc<SaleWithDetails[]>(() => window.api.sale.getAll());
  const { data: activeTrucks } = useIpc<TruckType[]>(() => window.api.truck.getActive());
  const { data: customers } = useIpc(() => window.api.customer.getActive());
  const { data: overdueResult } = useIpc<any>(() => window.api.invoice.getOverdue());

  const today = todayISO();
  const todaySales = sales?.filter((s) => s.saleDate.startsWith(today)) ?? [];
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalPrice, 0);
  const recentSales = (sales ?? []).slice(0, 8);
  const overdueInvoices = overdueResult?.success ? overdueResult.data : [];
  const overdueTotal = overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);

  const stats = [
    {
      label: t('dashboard.todaySales'),
      value: todaySales.length,
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: t('dashboard.todayRevenue'),
      value: formatCurrency(todayRevenue),
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: t('dashboard.activeTrucks'),
      value: activeTrucks?.length ?? 0,
      icon: Truck,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      label: t('dashboard.totalCustomers'),
      value: customers?.length ?? 0,
      icon: Users,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      label: t('dashboard.overdueInvoices'),
      value: overdueInvoices.length > 0 ? `${overdueInvoices.length} (${formatCurrency(overdueTotal)})` : '0',
      icon: AlertCircle,
      color: overdueInvoices.length > 0 ? 'text-red-600 bg-red-100' : 'text-gray-600 bg-gray-100',
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="page-title">{t('dashboard.title')}</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.quickActions')}</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/sales')}
              className="w-full btn-primary flex items-center gap-2 justify-center"
            >
              <Plus size={18} />
              {t('sales.newSale')}
            </button>
            <button
              onClick={() => navigate('/trucks')}
              className="w-full btn-secondary flex items-center gap-2 justify-center"
            >
              <Plus size={18} />
              {t('trucks.newTruck')}
            </button>
            <button
              onClick={() => navigate('/customers')}
              className="w-full btn-secondary flex items-center gap-2 justify-center"
            >
              <Plus size={18} />
              {t('customers.newCustomer')}
            </button>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.recentSales')}</h3>
          {recentSales.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('common.noData')}</p>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <span className="font-medium text-sm">{sale.productName}</span>
                    <span className="text-gray-400 mx-2">|</span>
                    <span className="text-sm text-gray-500">{sale.truckPlateNumber}</span>
                    {sale.customerName && (
                      <>
                        <span className="text-gray-400 mx-2">|</span>
                        <span className="text-sm text-gray-500">{sale.customerName}</span>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm">{formatCurrency(sale.totalPrice)}</span>
                    <p className="text-xs text-gray-400">{formatDateTime(sale.saleDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
