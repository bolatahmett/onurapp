import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onPaid?: () => void;
}

export function PaymentModal({ open, invoiceId, onClose, onPaid }: Props) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      await window.api.invoice.markPaid(invoiceId, { paymentMethod: method, paidDate: new Date().toISOString(), paymentNotes: notes });
      onPaid && onPaid();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('invoices.markPaid') ?? 'Mark Paid'}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('common.total')}</label>
          <input className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (optional)" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('payments.method') ?? 'Method'}</label>
          <select className="select-field" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="CASH">Cash</option>
            <option value="TRANSFER">Transfer</option>
            <option value="CHECK">Check</option>
            <option value="CREDIT_CARD">Card</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('common.notes')}</label>
          <textarea className="textarea-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={submit} disabled={loading}>{t('common.save')}</button>
        </div>
      </div>
    </Modal>
  );
}

export default PaymentModal;
