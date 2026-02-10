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
  
  const [showForm, setShowForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [closingTruck, setClosingTruck] = useState<Truck | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [existingInventoryIds, setExistingInventoryIds] = useState<string[]>([]); // Track which products were already in DB
  const [newInventoryProductId, setNewInventoryProductId] = useState('');
  const [newInventoryQty, setNewInventoryQty] = useState('');
  const [newInventoryUnitType, setNewInventoryUnitType] = useState<UnitType>(UnitType.CRATE);

  const [form, setForm] = useState({ plateNumber: '', driverName: '', driverPhone: '', notes: '' });

  const resetForm = () => {
    setForm({ plateNumber: '', driverName: '', driverPhone: '', notes: '' });
    setEditingTruck(null);
    setInventoryItems([]);
    setExistingInventoryIds([]);
    setNewInventoryProductId('');
    setNewInventoryQty('');
    setNewInventoryUnitType(UnitType.CRATE);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = async (truck: Truck) => {
    setForm({
      plateNumber: truck.plateNumber,
      driverName: truck.driverName ?? '',
      driverPhone: truck.driverPhone ?? '',
      notes: truck.notes ?? '',
    });
    setEditingTruck(truck);
    setNewInventoryProductId('');
    setNewInventoryQty('');
    setNewInventoryUnitType(UnitType.CRATE);
    setShowForm(true);

    // Load inventory immediately when opening edit modal
    try {
      const inventory = await window.api.truck.getInventory(truck.id);
      const existingItems = inventory.map(inv => ({
        productId: inv.productId,
        quantity: inv.quantity,
        unitType: inv.unitType,
      }));
      setInventoryItems(existingItems);
      // Track which products were already in database
      setExistingInventoryIds(existingItems.map(item => item.productId));
    } catch (err) {
      setInventoryItems([]);
      setExistingInventoryIds([]);
    }
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
        updated[existing].unitType = newInventoryUnitType;
        return updated;
      }
      return [...prev, { productId: newInventoryProductId, quantity: qty, unitType: newInventoryUnitType }];
    });

    setNewInventoryProductId('');
    setNewInventoryQty('');
  };

  const removeInventoryItem = (productId: string) => {
    setInventoryItems((prev) => prev.filter((i) => i.productId !== productId));
    // If this product was in the database (existing), we need to delete it on save
    // Remove it from existingInventoryIds so it won't be skipped on save
    // We'll track deletions separately
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let truckId = editingTruck?.id;
      
      if (editingTruck) {
        await window.api.truck.update(editingTruck.id, form);
      } else {
        const newTruck = await window.api.truck.create(form as CreateTruckDto);
        truckId = newTruck.id;
      }

      // If there's inventory items, add them to the truck
      if (truckId) {
        if (!editingTruck && inventoryItems.length > 0) {
          // For new truck, add all inventory items
          for (const item of inventoryItems) {
            await window.api.truck.addInventory(truckId, {
              productId: item.productId,
              quantity: item.quantity,
              unitType: item.unitType,
            });
          }
        } else if (editingTruck) {
          // For edited truck, handle inventory changes
          const currentProductIds = inventoryItems.map(item => item.productId);
          
          // Delete items that were in DB but removed from UI
          const deletedProductIds = existingInventoryIds.filter(id => !currentProductIds.includes(id));
          for (const productId of deletedProductIds) {
            await window.api.truck.deleteInventory(editingTruck.id, productId);
          }
          
          // Add new items (not in existingInventoryIds)
          const newItems = inventoryItems.filter(item => !existingInventoryIds.includes(item.productId));
          for (const item of newItems) {
            await window.api.truck.addInventory(editingTruck.id, {
              productId: item.productId,
              quantity: item.quantity,
              unitType: item.unitType,
            });
          }
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
                <select
                  className="select-field w-32"
                  value={newInventoryUnitType}
                  onChange={(e) => setNewInventoryUnitType(e.target.value as UnitType)}
                >
                  {Object.values(UnitType).map((ut) => (
                    <option key={ut} value={ut}>
                      {t(`sales.unitTypes.${ut}`)}
                    </option>
                  ))}
                </select>
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
                          {product?.name} {product?.variety ? `(${product?.variety})` : ''} - {item.quantity} {t(`sales.unitTypes.${item.unitType}`)}
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
