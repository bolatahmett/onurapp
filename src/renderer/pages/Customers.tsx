import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useIpc } from '../hooks/useIpc';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import MergeModal from '../components/customers/MergeModal';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import type { Customer, CreateCustomerDto, SaleWithDetails } from '@shared/types/entities';

export function Customers() {
  const { t } = useTranslation();
  const { data: customers, loading, refresh } = useIpc<Customer[]>(() => window.api.customer.getAll());
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<SaleWithDetails[]>([]);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeSource, setMergeSource] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    taxId: '',
    isTemporary: false,
  });

  const resetForm = () => {
    setForm({ name: '', phone: '', address: '', taxId: '', isTemporary: false });
    setEditingCustomer(null);
  };

  const openEdit = (customer: Customer) => {
    setForm({
      name: customer.name,
      phone: customer.phone ?? '',
      address: customer.address ?? '',
      taxId: customer.taxId ?? '',
      isTemporary: customer.isTemporary,
    });
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const viewSales = async (customer: Customer) => {
    const sales = await window.api.sale.getByCustomer(customer.id);
    setCustomerSales(sales);
    setSelectedCustomer(customer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await window.api.customer.update(editingCustomer.id, form);
      } else {
        await window.api.customer.create(form as CreateCustomerDto);
      }
      setShowForm(false);
      resetForm();
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns = [
    { key: 'name', header: t('customers.customerName') },
    { key: 'phone', header: t('common.phone'), render: (item: Customer) => item.phone || '-' },
    { key: 'taxId', header: t('customers.taxId'), render: (item: Customer) => item.taxId || '-' },
    {
      key: 'isTemporary',
      header: t('customers.isTemporary'),
      render: (item: Customer) =>
        item.isTemporary ? (
          <StatusBadge status="DRAFT" label={t('common.yes')} />
        ) : null,
    },
    {
      key: 'isActive',
      header: t('common.status'),
      render: (item: Customer) => (
        <StatusBadge
          status={item.isActive ? 'ACTIVE' : 'CLOSED'}
          label={item.isActive ? t('common.active') : t('common.inactive')}
        />
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: Customer) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-sm">
            {t('common.edit')}
          </button>
          <button onClick={() => viewSales(item)} className="text-green-600 hover:underline text-sm">
            {t('customers.salesHistory')}
          </button>
          <button onClick={() => { setMergeSource(item); setShowMerge(true); }} className="text-yellow-600 hover:underline text-sm">
            {t('customers.merge')}
          </button>
        </div>
      ),
    },
  ];

  const salesColumns = [
    { key: 'productName', header: t('sales.product') },
    { key: 'truckPlateNumber', header: t('sales.truck') },
    { key: 'quantity', header: t('sales.quantity') },
    {
      key: 'totalPrice',
      header: t('sales.totalPrice'),
      render: (item: SaleWithDetails) => formatCurrency(item.totalPrice),
    },
    {
      key: 'saleDate',
      header: t('sales.saleDate'),
      render: (item: SaleWithDetails) => formatDateTime(item.saleDate),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="page-title">{t('customers.title')}</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          {t('customers.newCustomer')}
        </button>
      </div>

      <div className="card">
        <DataTable columns={columns} data={customers ?? []} loading={loading} />
      </div>

      {/* Create/Edit Customer */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingCustomer ? t('common.edit') : t('customers.newCustomer')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('customers.customerName')} *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('common.phone')}</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('common.address')}</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('customers.taxId')}</label>
            <input
              className="input-field"
              value={form.taxId}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isTemporary"
              checked={form.isTemporary}
              onChange={(e) => setForm({ ...form, isTemporary: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isTemporary" className="text-sm">{t('customers.isTemporary')}</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary">
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Sales History */}
      <Modal
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`${selectedCustomer?.name} - ${t('customers.salesHistory')}`}
        wide
      >
        <DataTable columns={salesColumns} data={customerSales} />
        {customerSales.length > 0 && (
          <div className="mt-4 text-right">
            <span className="font-semibold">
              {t('common.total')}: {formatCurrency(customerSales.reduce((s, sale) => s + sale.totalPrice, 0))}
            </span>
          </div>
        )}
      </Modal>

      <MergeModal
        open={showMerge}
        sourceCustomerId={mergeSource?.id}
        onClose={() => { setShowMerge(false); setMergeSource(null); }}
        onMerged={async () => {
          setShowMerge(false);
          setMergeSource(null);
          refresh();
        }}
      />
    </div>
  );
}
