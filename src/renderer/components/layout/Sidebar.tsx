import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Users,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/sales', icon: ShoppingCart, labelKey: 'nav.sales' },
  { path: '/trucks', icon: Truck, labelKey: 'nav.trucks' },
  { path: '/products', icon: Package, labelKey: 'nav.products' },
  { path: '/customers', icon: Users, labelKey: 'nav.customers' },
  { path: '/invoices', icon: FileText, labelKey: 'nav.invoices' },
  { path: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export function Sidebar() {
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`bg-gray-900 text-white flex flex-col transition-all duration-200 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold text-primary-400">OnurLtd</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-gray-700 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">{t(item.labelKey)}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
