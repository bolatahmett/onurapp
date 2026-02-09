import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import type { SaleWithDetails } from '@shared/types/entities';

interface Props {
  open: boolean;
  truckId?: string | null;
  onClose: () => void;
}

export function TruckDrilldown({ open, truckId, onClose }: Props) {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !truckId) return;
    setLoading(true);
    window.api.sale.getByTruck(truckId).then((res: any) => {
      setSales(res || []);
    }).catch(() => setSales([])).finally(() => setLoading(false));
  }, [open, truckId]);

  return (
    <Modal open={open} onClose={onClose} title={`Truck ${truckId} - Sales`} wide>
      <div className="space-y-2">
        {loading && <div>{'Loading...'}</div>}
        {!loading && sales.length === 0 && <div>{'No sales found'}</div>}
        {!loading && sales.map((s) => (
          <div key={s.id} className="p-2 border rounded">
            <div className="flex justify-between">
              <div>{s.productName} x{s.quantity}</div>
              <div className="font-semibold">{s.totalPrice.toFixed(2)}</div>
            </div>
            <div className="text-xs text-gray-500">{s.customerName ?? '—'} • {new Date(s.saleDate).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default TruckDrilldown;
