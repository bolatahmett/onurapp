import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useIpc } from '../hooks/useIpc';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import type { Product, CreateProductDto } from '@shared/types/entities';
import { UnitType } from '@shared/types/enums';

export function Products() {
  const { t } = useTranslation();
  const { data: products, loading, refresh } = useIpc<Product[]>(() => window.api.product.getAll());
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '',
    variety: '',
    defaultUnitType: UnitType.CRATE as UnitType,
  });

  const resetForm = () => {
    setForm({ name: '', variety: '', defaultUnitType: UnitType.CRATE });
    setEditingProduct(null);
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      variety: product.variety ?? '',
      defaultUnitType: product.defaultUnitType,
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await window.api.product.update(editingProduct.id, {
          name: form.name,
          variety: form.variety || undefined,
          defaultUnitType: form.defaultUnitType,
        });
      } else {
        await window.api.product.create({
          name: form.name,
          variety: form.variety || undefined,
          defaultUnitType: form.defaultUnitType,
        } as CreateProductDto);
      }
      setShowForm(false);
      resetForm();
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (product: Product) => {
    await window.api.product.update(product.id, { isActive: !product.isActive });
    refresh();
  };

  const columns = [
    { key: 'name', header: t('products.productName') },
    {
      key: 'variety',
      header: t('products.variety'),
      render: (item: Product) => item.variety || '-',
    },
    {
      key: 'defaultUnitType',
      header: t('products.defaultUnit'),
      render: (item: Product) => t(`sales.unitTypes.${item.defaultUnitType}`),
    },
    {
      key: 'isActive',
      header: t('common.status'),
      render: (item: Product) => (
        <StatusBadge
          status={item.isActive ? 'ACTIVE' : 'CLOSED'}
          label={item.isActive ? t('common.active') : t('common.inactive')}
        />
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: Product) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-sm">
            {t('common.edit')}
          </button>
          <button
            onClick={() => toggleActive(item)}
            className="text-orange-600 hover:underline text-sm"
          >
            {item.isActive ? t('common.inactive') : t('common.active')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="page-title">{t('products.title')}</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          {t('products.newProduct')}
        </button>
      </div>

      <div className="card">
        <DataTable columns={columns} data={products ?? []} loading={loading} />
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingProduct ? t('common.edit') : t('products.newProduct')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('products.productName')} *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('products.variety')}</label>
            <input
              className="input-field"
              value={form.variety}
              onChange={(e) => setForm({ ...form, variety: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('products.defaultUnit')}</label>
            <div className="flex gap-2">
              {Object.values(UnitType).map((ut) => (
                <button
                  key={ut}
                  type="button"
                  onClick={() => setForm({ ...form, defaultUnitType: ut })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.defaultUnitType === ut
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t(`sales.unitTypes.${ut}`)}
                </button>
              ))}
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
    </div>
  );
}
