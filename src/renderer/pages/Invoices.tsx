import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useIpc } from '../hooks/useIpc';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import type {
  Invoice,
  InvoiceWithDetails,
  Customer,
  SaleWithDetails,
  CreateInvoiceDto,
} from '@shared/types/entities';
import { InvoiceStatus } from '@shared/types/enums';

export function Invoices() {
  const { t } = useTranslation();
  const { data: invoices, loading, refresh } = useIpc<Invoice[]>(() => window.api.invoice.getAll());
  const { data: customers } = useIpc<Customer[]>(() => window.api.customer.getActive());

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [uninvoicedSales, setUninvoicedSales] = useState<SaleWithDetails[]>([]);
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState({ customerId: '', notes: '', dueDate: '' });

  const handleCustomerSelect = async (customerId: string) => {
    setCreateForm({ ...createForm, customerId });
    setSelectedSaleIds([]);
    if (customerId) {
      const sales = await window.api.sale.getUninvoiced(customerId);
      setUninvoicedSales(sales);
    } else {
      setUninvoicedSales([]);
    }
  };

  const toggleSale = (saleId: string) => {
    setSelectedSaleIds((prev) =>
      prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]
    );
  };

  const handleCreate = async () => {
    if (!createForm.customerId || !selectedSaleIds.length) return;
    try {
      const dto: CreateInvoiceDto = {
        customerId: createForm.customerId,
        saleIds: selectedSaleIds,
        notes: createForm.notes || undefined,
        dueDate: createForm.dueDate || undefined,
      };
      await window.api.invoice.create(dto);
      setShowCreate(false);
      setCreateForm({ customerId: '', notes: '', dueDate: '' });
      setSelectedSaleIds([]);
      setUninvoicedSales([]);
      refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const viewDetail = async (invoice: Invoice) => {
    const detail = await window.api.invoice.getById(invoice.id);
    setSelectedInvoice(detail);
    setShowDetail(true);
  };

  const updateStatus = async (invoiceId: string, status: InvoiceStatus) => {
    await window.api.invoice.update(invoiceId, { status });
    if (selectedInvoice) {
      const detail = await window.api.invoice.getById(invoiceId);
      setSelectedInvoice(detail);
    }
    refresh();
  };

  const selectedTotal = uninvoicedSales
    .filter((s) => selectedSaleIds.includes(s.id))
    .reduce((sum, s) => sum + s.totalPrice, 0);

  const columns = [
    { key: 'invoiceNumber', header: t('invoices.invoiceNumber') },
    {
      key: 'customerId',
      header: t('sales.customer'),
      render: (item: Invoice) => {
        const c = customers?.find((c) => c.id === item.customerId);
        return c?.name ?? '-';
      },
    },
    {
      key: 'totalAmount',
      header: t('invoices.totalAmount'),
      render: (item: Invoice) => <span className="font-semibold">{formatCurrency(item.totalAmount)}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (item: Invoice) => (
        <StatusBadge status={item.status} label={t(`invoices.status.${item.status}`)} />
      ),
    },
    {
      key: 'issueDate',
      header: t('invoices.issueDate'),
      render: (item: Invoice) => item.issueDate ? formatDate(item.issueDate) : '-',
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: Invoice) => (
        <div className="flex gap-2">
          <button onClick={() => viewDetail(item)} className="text-blue-600 hover:underline text-sm">
            {t('common.edit')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="page-title">{t('invoices.title')}</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {t('invoices.newInvoice')}
        </button>
      </div>

      <div className="card">
        <DataTable columns={columns} data={invoices ?? []} loading={loading} />
      </div>

      {/* Create Invoice */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('invoices.newInvoice')} wide>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('sales.customer')} *</label>
            <select
              className="select-field"
              value={createForm.customerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
            >
              <option value="">{t('sales.selectCustomer')}</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {uninvoicedSales.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">{t('invoices.selectSales')}</label>
              <div className="border rounded-lg divide-y max-h-60 overflow-auto">
                {uninvoicedSales.map((sale) => (
                  <label
                    key={sale.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSaleIds.includes(sale.id)}
                      onChange={() => toggleSale(sale.id)}
                      className="w-4 h-4"
                    />
                    <span className="flex-1 text-sm">
                      {sale.productName} - {sale.quantity} {t(`sales.unitTypes.${sale.unitType}`)}
                    </span>
                    <span className="text-sm text-gray-500">{formatDateTime(sale.saleDate)}</span>
                    <span className="text-sm font-semibold">{formatCurrency(sale.totalPrice)}</span>
                  </label>
                ))}
              </div>
              <div className="text-right mt-2">
                <span className="font-semibold">{t('common.total')}: {formatCurrency(selectedTotal)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('invoices.dueDate')}</label>
              <input
                type="date"
                className="input-field"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.notes')}</label>
              <input
                className="input-field"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={!createForm.customerId || !selectedSaleIds.length}
              className="btn-primary"
            >
              {t('common.create')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Invoice Detail */}
      <Modal
        open={showDetail}
        onClose={() => setShowDetail(false)}
        title={selectedInvoice?.invoiceNumber ?? ''}
        wide
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t('sales.customer')}: </span>
                <span className="font-medium">{selectedInvoice.customerName}</span>
              </div>
              <div>
                <span className="text-gray-500">{t('common.status')}: </span>
                <StatusBadge
                  status={selectedInvoice.status}
                  label={t(`invoices.status.${selectedInvoice.status}`)}
                />
              </div>
              <div>
                <span className="text-gray-500">{t('invoices.totalAmount')}: </span>
                <span className="font-bold text-lg">{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
              <div>
                <span className="text-gray-500">{t('invoices.issueDate')}: </span>
                <span>{selectedInvoice.issueDate ? formatDate(selectedInvoice.issueDate) : '-'}</span>
              </div>
            </div>

            <div className="border rounded-lg divide-y">
              {selectedInvoice.sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{sale.productName}</span>
                  <span>{sale.quantity} {t(`sales.unitTypes.${sale.unitType}`)}</span>
                  <span className="font-semibold">{formatCurrency(sale.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                {selectedInvoice.status === InvoiceStatus.DRAFT && (
                  <button
                    onClick={() => updateStatus(selectedInvoice.id, InvoiceStatus.ISSUED)}
                    className="btn-primary btn-sm"
                  >
                    {t('invoices.status.ISSUED')}
                  </button>
                )}
                {selectedInvoice.status === InvoiceStatus.ISSUED && (
                  <button
                    onClick={() => updateStatus(selectedInvoice.id, InvoiceStatus.PAID)}
                    className="btn-primary btn-sm"
                  >
                    {t('invoices.status.PAID')}
                  </button>
                )}
                {selectedInvoice.status !== InvoiceStatus.CANCELLED &&
                  selectedInvoice.status !== InvoiceStatus.PAID && (
                  <button
                    onClick={() => updateStatus(selectedInvoice.id, InvoiceStatus.CANCELLED)}
                    className="btn-danger btn-sm"
                  >
                    {t('invoices.status.CANCELLED')}
                  </button>
                )}
              </div>
              <button onClick={() => setShowDetail(false)} className="btn-secondary btn-sm">
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
