import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useIpc } from '../hooks/useIpc';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatDateTime } from '../utils/formatters';
import type { Truck, CreateTruckDto } from '@shared/types/entities';

export function Trucks() {
  const { t } = useTranslation();
  const { data: trucks, loading, refresh } = useIpc<Truck[]>(() => window.api.truck.getAll());
  const [showForm, setShowForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [closingTruck, setClosingTruck] = useState<Truck | null>(null);

  const [form, setForm] = useState({ plateNumber: '', driverName: '', driverPhone: '', notes: '' });

  const resetForm = () => {
    setForm({ plateNumber: '', driverName: '', driverPhone: '', notes: '' });
    setEditingTruck(null);
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
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTruck) {
        await window.api.truck.update(editingTruck.id, form);
      } else {
        await window.api.truck.create(form as CreateTruckDto);
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
