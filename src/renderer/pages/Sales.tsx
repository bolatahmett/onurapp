import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, UserPlus } from 'lucide-react';
import { useIpc } from '../hooks/useIpc';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import type {
  SaleWithDetails,
  Truck,
  Product,
  Customer,
  CreateSaleDto,
} from '@shared/types/entities';
import { UnitType } from '@shared/types/enums';

export function Sales() {
  const { t } = useTranslation();
  const { data: sales, loading, refresh } = useIpc<SaleWithDetails[]>(() => window.api.sale.getAll());
  const { data: activeTrucks } = useIpc<Truck[]>(() => window.api.truck.getActive());
  const { data: products } = useIpc<Product[]>(() => window.api.product.getActive());
  const { data: customers } = useIpc<Customer[]>(() => window.api.customer.getActive());

  const [showForm, setShowForm] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [filterTruck, setFilterTruck] = useState('');

  const qtyRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    truckId: '',
    productId: '',
    customerId: '',
    unitType: UnitType.CRATE as UnitType,
    quantity: '',
    unitPrice: '',
    notes: '',
  });

  // Auto-select first active truck
  useEffect(() => {
    if (activeTrucks?.length && !form.truckId) {
      setForm((f) => ({ ...f, truckId: activeTrucks[0].id }));
    }
  }, [activeTrucks]);

  const resetForm = () => {
    setForm((f) => ({
      ...f,
      productId: '',
      customerId: '',
      quantity: '',
      unitPrice: '',
      notes: '',
    }));
  };

  const totalPrice = (parseFloat(form.quantity) || 0) * (parseFloat(form.unitPrice) || 0);

  const handleSubmit = async (e: React.FormEvent, saveAndNew: boolean) => {
    e.preventDefault();
    try {
      const dto: CreateSaleDto = {
        truckId: form.truckId,
        productId: form.productId,
        customerId: form.customerId || undefined,
        unitType: form.unitType,
        quantity: parseFloat(form.quantity),
        unitPrice: parseFloat(form.unitPrice),
        notes: form.notes || undefined,
      };
      await window.api.sale.create(dto);
      refresh();
      if (saveAndNew) {
        resetForm();
        setTimeout(() => qtyRef.current?.focus(), 50);
      } else {
        setShowForm(false);
        resetForm();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignCustomer = async () => {
    if (!selectedSaleIds.length || !assignCustomerId) return;
    try {
      await window.api.sale.assignCustomer(selectedSaleIds, assignCustomerId);
      setShowAssign(false);
      setSelectedSaleIds([]);
      setAssignCustomerId('');
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    setForm((f) => ({
      ...f,
      productId,
      unitType: product?.defaultUnitType ?? f.unitType,
    }));
  };

  const toggleSaleSelection = (saleId: string) => {
    setSelectedSaleIds((prev) =>
      prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]
    );
  };

  const filteredSales = filterTruck
    ? (sales ?? []).filter((s) => s.truckId === filterTruck)
    : (sales ?? []);

  const columns = [
    {
      key: 'select',
      header: '',
      render: (item: SaleWithDetails) => (
        <input
          type="checkbox"
          checked={selectedSaleIds.includes(item.id)}
          onChange={() => toggleSaleSelection(item.id)}
          className="w-4 h-4"
        />
      ),
      className: 'w-8',
    },
    { key: 'productName', header: t('sales.product') },
    {
      key: 'unitType',
      header: t('sales.unitType'),
      render: (item: SaleWithDetails) => t(`sales.unitTypes.${item.unitType}`),
    },
    { key: 'quantity', header: t('sales.quantity') },
    {
      key: 'unitPrice',
      header: t('sales.unitPrice'),
      render: (item: SaleWithDetails) => formatCurrency(item.unitPrice),
    },
    {
      key: 'totalPrice',
      header: t('sales.totalPrice'),
      render: (item: SaleWithDetails) => (
        <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
      ),
    },
    {
      key: 'customerName',
      header: t('sales.customer'),
      render: (item: SaleWithDetails) => item.customerName || (
        <span className="text-gray-400 italic">{t('sales.noCustomer')}</span>
      ),
    },
    { key: 'truckPlateNumber', header: t('sales.truck') },
    {
      key: 'saleDate',
      header: t('sales.saleDate'),
      render: (item: SaleWithDetails) => formatDateTime(item.saleDate),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="page-title">{t('sales.title')}</h2>
        <div className="flex gap-2">
          {selectedSaleIds.length > 0 && (
            <button
              onClick={() => setShowAssign(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <UserPlus size={18} />
              {t('sales.assignCustomer')} ({selectedSaleIds.length})
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            {t('sales.newSale')}
          </button>
        </div>
      </div>

      {/* Truck Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterTruck('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !filterTruck ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t('common.all')}
        </button>
        {activeTrucks?.map((truck) => (
          <button
            key={truck.id}
            onClick={() => setFilterTruck(truck.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterTruck === truck.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {truck.plateNumber}
          </button>
        ))}
      </div>

      <div className="card">
        <DataTable columns={columns} data={filteredSales} loading={loading} />
      </div>

      {/* Sale Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={t('sales.newSale')}>
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('sales.truck')} *</label>
            <select
              className="select-field"
              value={form.truckId}
              onChange={(e) => setForm({ ...form, truckId: e.target.value })}
              required
            >
              <option value="">{t('sales.selectTruck')}</option>
              {activeTrucks?.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.plateNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('sales.product')} *</label>
            <select
              className="select-field"
              value={form.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              required
            >
              <option value="">{t('sales.selectProduct')}</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.variety ? `(${p.variety})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('sales.unitType')} *</label>
            <div className="flex gap-2">
              {Object.values(UnitType).map((ut) => (
                <button
                  key={ut}
                  type="button"
                  onClick={() => setForm({ ...form, unitType: ut })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.unitType === ut
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t(`sales.unitTypes.${ut}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('sales.quantity')} *</label>
              <input
                ref={qtyRef}
                type="number"
                step="0.01"
                min="0.01"
                className="input-field"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('sales.unitPrice')} *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <span className="text-sm text-gray-500">{t('sales.totalPrice')}: </span>
            <span className="text-xl font-bold text-primary-700">{formatCurrency(totalPrice)}</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('sales.customer')}</label>
            <select
              className="select-field"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            >
              <option value="">{t('sales.selectCustomer')}</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('common.notes')}</label>
            <input
              className="input-field"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e as any, true)}
              className="btn-secondary"
            >
              {t('sales.saveAndNew')}
            </button>
            <button type="submit" className="btn-primary">
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Customer Modal */}
      <Modal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        title={t('sales.assignCustomer')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {selectedSaleIds.length} {t('sales.title').toLowerCase()} selected
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">{t('sales.customer')} *</label>
            <select
              className="select-field"
              value={assignCustomerId}
              onChange={(e) => setAssignCustomerId(e.target.value)}
            >
              <option value="">{t('sales.selectCustomer')}</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAssign(false)} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleAssignCustomer}
              disabled={!assignCustomerId}
              className="btn-primary"
            >
              {t('sales.assignCustomer')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
