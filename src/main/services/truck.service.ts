import { TruckRepository } from '../repositories/truck.repository';
import { Truck, CreateTruckDto, UpdateTruckDto } from '../../shared/types/entities';
import { TruckStatus } from '../../shared/types/enums';
import { auditService } from './AuditService';

export class TruckService {
  private repo = new TruckRepository();

  getAll(): Truck[] {
    return this.repo.getAll();
  }

  getActive(): Truck[] {
    return this.repo.getActive();
  }

  getById(id: string): Truck | null {
    return this.repo.getById(id);
  }

  create(dto: CreateTruckDto): Truck {
    if (!dto.plateNumber?.trim()) {
      throw new Error('Plate number is required');
    }
    const truck = this.repo.create(dto);
    auditService.log('Truck', truck.id, 'CREATE', null, JSON.stringify(dto));
    return truck;
  }

  update(id: string, dto: UpdateTruckDto): Truck | null {
    const truck = this.repo.getById(id);
    if (!truck) throw new Error('Truck not found');
    const updated = this.repo.update(id, dto);
    if (updated) {
      auditService.log('Truck', id, 'UPDATE', null, JSON.stringify(dto));
    }
    return updated;
  }

  close(id: string): Truck | null {
    const truck = this.repo.getById(id);
    if (!truck) throw new Error('Truck not found');
    if (truck.status === TruckStatus.CLOSED) {
      throw new Error('Truck is already closed');
    }
    const closed = this.repo.close(id);
    if (closed) {
      auditService.log('Truck', id, 'CLOSE', null, JSON.stringify({ status: TruckStatus.CLOSED }));
    }
    return closed;
  }

  delete(id: string): boolean {
    const success = this.repo.delete(id);
    if (success) {
      auditService.log('Truck', id, 'DELETE', null);
    }
    return success;
  }
}
