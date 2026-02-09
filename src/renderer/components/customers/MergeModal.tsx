import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { useTranslation } from 'react-i18next';
import type { Customer } from '@shared/types/entities';

interface Props {
  open: boolean;
  sourceCustomerId?: string | null;
  onClose: () => void;
  onMerged?: () => void;
}

export function MergeModal({ open, sourceCustomerId, onClose, onMerged }: Props) {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [targetId, setTargetId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    window.api.customer.getActive().then((res: any) => setCustomers(res || []));
  }, [open]);

  const submit = async () => {
    if (!sourceCustomerId || !targetId) return;
    setLoading(true);
    try {
      await window.api.customer.merge(sourceCustomerId, targetId);
      onMerged && onMerged();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to merge');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('customers.merge') ?? 'Merge Customer'}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('customers.selectTarget') ?? 'Select target customer'}</label>
          <select className="select-field" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">{t('common.select') ?? 'Select'}</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={submit} disabled={loading || !targetId}>{t('common.save')}</button>
        </div>
      </div>
    </Modal>
  );
}

export default MergeModal;
