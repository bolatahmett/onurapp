import { TruckRepository } from '../repositories/truck.repository';
import { Truck, CreateTruckDto, UpdateTruckDto } from '../../shared/types/entities';
import { TruckStatus } from '../../shared/types/enums';

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
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateTruckDto): Truck | null {
    const truck = this.repo.getById(id);
    if (!truck) throw new Error('Truck not found');
    return this.repo.update(id, dto);
  }

  close(id: string): Truck | null {
    const truck = this.repo.getById(id);
    if (!truck) throw new Error('Truck not found');
    if (truck.status === TruckStatus.CLOSED) {
      throw new Error('Truck is already closed');
    }
    return this.repo.close(id);
  }

  delete(id: string): boolean {
    return this.repo.delete(id);
  }
}
