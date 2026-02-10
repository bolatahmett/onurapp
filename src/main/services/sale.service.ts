import { SaleRepository } from '../repositories/sale.repository';
import { Sale, SaleWithDetails, CreateSaleDto, UpdateSaleDto } from '../../shared/types/entities';
import { auditService } from './AuditService';

export class SaleService {
  private repo = new SaleRepository();

  getAll(): SaleWithDetails[] {
    return this.repo.getAll();
  }

  getByTruck(truckId: string): SaleWithDetails[] {
    return this.repo.getByTruck(truckId);
  }

  getByCustomer(customerId: string): SaleWithDetails[] {
    return this.repo.getByCustomer(customerId);
  }

  getUnassigned(): SaleWithDetails[] {
    return this.repo.getUnassigned();
  }

  getUninvoiced(customerId?: string): SaleWithDetails[] {
    return this.repo.getUninvoiced(customerId);
  }

  getById(id: string): SaleWithDetails | null {
    return this.repo.getById(id);
  }

  create(dto: CreateSaleDto): Sale {
    if (!dto.truckId) throw new Error('Truck is required');
    if (!dto.productId) throw new Error('Product is required');
    if (dto.quantity <= 0) throw new Error('Quantity must be positive');
    if (dto.unitPrice < 0) throw new Error('Unit price cannot be negative');
    const sale = this.repo.create(dto);
    auditService.log('Sale', sale.id, 'CREATE', null, JSON.stringify({
      truckId: dto.truckId,
      productId: dto.productId,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      totalPrice: sale.totalPrice,
    }));
    return sale;
  }

  update(id: string, dto: UpdateSaleDto): Sale | null {
    const updated = this.repo.update(id, dto);
    if (updated) {
      auditService.log('Sale', id, 'UPDATE', null, JSON.stringify(dto));
    }
    return updated;
  }

  assignCustomer(saleIds: string[], customerId: string): number {
    if (!saleIds.length) throw new Error('No sales selected');
    if (!customerId) throw new Error('Customer is required');
    const count = this.repo.assignCustomer(saleIds, customerId);
    auditService.log('Sale', saleIds.join(','), 'ASSIGN_CUSTOMER', null, JSON.stringify({ customerId, count }));
    return count;
  }

  delete(id: string): boolean {
    const success = this.repo.delete(id);
    if (success) {
      auditService.log('Sale', id, 'DELETE', null, 'Soft delete');
    }
    return success;
  }
}
