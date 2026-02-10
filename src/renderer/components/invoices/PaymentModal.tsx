import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  open: boolean;
  invoiceId: string | null;
  invoiceTotal?: number;
  remainingBalance?: number;
  onClose: () => void;
  onPaid?: () => void;
}

export function PaymentModal({ open, invoiceId, invoiceTotal, remainingBalance, onClose, onPaid }: Props) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseFloat(amount);
  const maxAmount = remainingBalance ?? invoiceTotal ?? 0;

  const submit = async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      const payAmount = parsedAmount > 0 ? parsedAmount : maxAmount;
      await window.api.invoice.makePartialPayment(invoiceId, payAmount, method, notes || undefined);
      setAmount('');
      setNotes('');
      onPaid && onPaid();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('invoices.makePayment')}>
      <div className="space-y-4">
        {maxAmount > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('invoices.remainingBalance')}:</span>
              <span className="font-semibold text-red-600">{formatCurrency(maxAmount)}</span>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">{t('invoices.paymentAmount')}</label>
          <input
            className="input-field"
            type="number"
            step="0.01"
            min="0.01"
            max={maxAmount || undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={maxAmount > 0 ? formatCurrency(maxAmount) : ''}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('payments.method')}</label>
          <select className="select-field" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="CASH">{t('payments.CASH')}</option>
            <option value="TRANSFER">{t('payments.TRANSFER')}</option>
            <option value="CHECK">{t('payments.CHECK')}</option>
            <option value="CREDIT_CARD">{t('payments.CREDIT_CARD')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('common.notes')}</label>
          <textarea className="textarea-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={submit} disabled={loading || (parsedAmount > 0 && parsedAmount > maxAmount)}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default PaymentModal;
