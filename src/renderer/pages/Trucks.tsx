import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { useIpc } from '../hooks/useIpc';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatDateTime } from '../utils/formatters';
import type { Truck, Product, CreateTruckDto, TruckInventory } from '@shared/types/entities';
import { UnitType } from '@shared/types/enums';

interface InventoryItem {
  productId: string;
  quantity: number;
  unitType: UnitType;
}

export function Trucks() {
  const { t } = useTranslation();
  const { data: trucks, loading, refresh } = useIpc<Truck[]>(() => window.api.truck.getAll());
  const { data: products } = useIpc<Product[]>(() => window.api.product.getActive());
  const { data: inventory } = useIpc<TruckInventory[]>(() => 
    editingTruck ? window.api.truck.getInventory(editingTruck.id) : Promise.resolve([])
  );
  
  const [showForm, setShowForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [closingTruck, setClosingTruck] = useState<Truck | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [newInventoryProductId, setNewInventoryProductId] = useState('');
  const [newInventoryQty, setNewInventoryQty] = useState('');

  const [form, setForm] = useState({ plateNumber: '', driverName: '', driverPhone: '', notes: '' });

  const resetForm = () => {
    setForm({ plateNumber: '', driverName: '', driverPhone: '', notes: '' });
    setEditingTruck(null);
    setInventoryItems([]);
    setNewInventoryProductId('');
    setNewInventoryQty('');
      setNewInventoryUnitType(UnitType.CRATE);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (truck: Truck) => {
    setForm({
      plateNumber: truck.plateNumber,
      driverName: truck.driverName ?? '',
      driverPhone: truck.driverPhone ?? '',
      notes: truck.notes ?? '',
    });
    setEditingTruck(truck);
    setInventoryItems([]);
    setNewInventoryProductId('');
    setNewInventoryQty('');
    setShowForm(true);
  };

  const addInventoryItem = () => {
    if (!newInventoryProductId || !newInventoryQty) {
      alert(t('common.error'));
      return;
    }
    
    const qty = parseFloat(newInventoryQty);
    if (qty <= 0) {
      alert(t('common.error'));
      return;
    }

    setInventoryItems((prev) => {
      const existing = prev.findIndex((i) => i.productId === newInventoryProductId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity = qty;
        return updated;
      }
      return [...prev, { productId: newInventoryProductId, quantity: qty }];
    });

    setNewInventoryProductId('');
    setNewInventoryQty('');
  };

  const removeInventoryItem = (productId: string) => {
    setInventoryItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTruck) {
        await window.api.truck.update(editingTruck.id, form);
      } else {
        await window.api.truck.create(form as CreateTruckDto);
      }

      // If there's a newly created truck and inventory items, add them
      if (!editingTruck && inventoryItems.length > 0) {
        const createdTrucks = await window.api.truck.getActive();
        const newTruck = createdTrucks[createdTrucks.length - 1];
        
        for (const item of inventoryItems) {
          await window.api.truck.addInventory(newTruck.id, {
            productId: item.productId,
            quantity: item.quantity,
          });
        }
      } else if (editingTruck && inventoryItems.length > 0) {
        // For edited truck, add inventory
        for (const item of inventoryItems) {
          await window.api.truck.addInventory(editingTruck.id, {
            productId: item.productId,
            quantity: item.quantity,
          });
        }
      }

      setShowForm(false);
      resetForm();
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClose = async () => {
    if (!closingTruck) return;
    try {
      await window.api.truck.close(closingTruck.id);
      setClosingTruck(null);
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns = [
    { key: 'plateNumber', header: t('trucks.plateNumber') },
    { key: 'driverName', header: t('trucks.driverName'), render: (item: Truck) => item.driverName || '-' },
    {
      key: 'arrivalDate',
      header: t('trucks.arrivalDate'),
      render: (item: Truck) => formatDateTime(item.arrivalDate),
    },
    {
      key: 'departureDate',
      header: t('trucks.departureDate'),
      render: (item: Truck) => item.departureDate ? formatDateTime(item.departureDate) : '-',
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (item: Truck) => (
        <StatusBadge status={item.status} label={t(`trucks.status.${item.status}`)} />
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: Truck) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-sm">
            {t('common.edit')}
          </button>
          {item.status === 'ACTIVE' && (
            <button
              onClick={() => setClosingTruck(item)}
              className="text-orange-600 hover:underline text-sm"
            >
              {t('trucks.closeTruck')}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="page-title">{t('trucks.title')}</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {t('trucks.newTruck')}
        </button>
      </div>

      <div className="card">
        <DataTable columns={columns} data={trucks ?? []} loading={loading} />
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingTruck ? t('common.edit') : t('trucks.newTruck')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('trucks.plateNumber')} *</label>
            <input
              className="input-field"
              value={form.plateNumber}
              onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
              placeholder="34 ABC 123"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('trucks.driverName')}</label>
            <input
              className="input-field"
              value={form.driverName}
              onChange={(e) => setForm({ ...form, driverName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('trucks.driverPhone')}</label>
            <input
              className="input-field"
              value={form.driverPhone}
              onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('common.notes')}</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Inventory Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">{t('trucks.inventory')}</h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  className="select-field flex-1"
                  value={newInventoryProductId}
                  onChange={(e) => setNewInventoryProductId(e.target.value)}
                >
                  <option value="">{t('trucks.selectProduct')}</option>
                  {products?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.variety ? `(${p.variety})` : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input-field w-24"
                  placeholder={t('trucks.quantity')}
                  value={newInventoryQty}
                  onChange={(e) => setNewInventoryQty(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addInventoryItem}
                  className="btn-secondary px-3"
                >
                  {t('common.create')}
                </button>
              </div>

              {inventoryItems.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {inventoryItems.map((item) => {
                    const product = products?.find((p) => p.id === item.productId);
                    return (
                      <div key={item.productId} className="flex items-center justify-between bg-white p-2 rounded">
                        <span className="text-sm">
                          {product?.name} {product?.variety ? `(${product?.variety})` : ''} - {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeInventoryItem(item.productId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

      <ConfirmDialog
        open={!!closingTruck}
        title={t('trucks.closeTruck')}
        message={t('trucks.confirmClose')}
        onConfirm={handleClose}
        onCancel={() => setClosingTruck(null)}
      />
    </div>
  );
}
