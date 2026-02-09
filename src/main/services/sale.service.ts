import { SaleRepository } from '../repositories/sale.repository';
import { Sale, SaleWithDetails, CreateSaleDto, UpdateSaleDto } from '../../shared/types/entities';

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
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateSaleDto): Sale | null {
    return this.repo.update(id, dto);
  }

  assignCustomer(saleIds: string[], customerId: string): number {
    if (!saleIds.length) throw new Error('No sales selected');
    if (!customerId) throw new Error('Customer is required');
    return this.repo.assignCustomer(saleIds, customerId);
  }

  delete(id: string): boolean {
    return this.repo.delete(id);
  }
}
