import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base.repository';
import { Truck, CreateTruckDto, UpdateTruckDto } from '../../shared/types/entities';
import { TruckStatus } from '../../shared/types/enums';

export class TruckRepository extends BaseRepository {
  getAll(): Truck[] {
    return this.queryAll('SELECT * FROM trucks WHERE deleted_at IS NULL ORDER BY arrival_date DESC').map(this.mapRow);
  }

  getActive(): Truck[] {
    return this.queryAll(
      'SELECT * FROM trucks WHERE status = ? AND deleted_at IS NULL ORDER BY arrival_date DESC',
      [TruckStatus.ACTIVE]
    ).map(this.mapRow);
  }

  getById(id: string): Truck | null {
    const row = this.queryOne('SELECT * FROM trucks WHERE id = ? AND deleted_at IS NULL', [id]);
    return row ? this.mapRow(row) : null;
  }

  create(dto: CreateTruckDto): Truck {
    const id = uuidv4();
    const now = this.now();
    this.execute(
      `INSERT INTO trucks (id, plate_number, driver_name, driver_phone, arrival_date, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dto.plateNumber, dto.driverName ?? null, dto.driverPhone ?? null,
        dto.arrivalDate ?? now, TruckStatus.ACTIVE, dto.notes ?? null, now, now]
    );
    return this.getById(id)!;
  }

  update(id: string, dto: UpdateTruckDto): Truck | null {
    const truck = this.getById(id);
    if (!truck) return null;
    const now = this.now();
    this.execute(
      `UPDATE trucks SET plate_number = ?, driver_name = ?, driver_phone = ?, notes = ?, updated_at = ? WHERE id = ?`,
      [
        dto.plateNumber ?? truck.plateNumber,
        dto.driverName !== undefined ? dto.driverName : truck.driverName,
        dto.driverPhone !== undefined ? dto.driverPhone : truck.driverPhone,
        dto.notes !== undefined ? dto.notes : truck.notes,
        now, id,
      ]
    );
    return this.getById(id);
  }

  close(id: string): Truck | null {
    const now = this.now();
    this.execute(
      'UPDATE trucks SET status = ?, departure_date = ?, updated_at = ? WHERE id = ?',
      [TruckStatus.CLOSED, now, now, id]
    );
    return this.getById(id);
  }

  delete(id: string): boolean {
    const now = this.now();
    this.execute('UPDATE trucks SET deleted_at = ? WHERE id = ?', [now, id]);
    return this.changes() > 0;
  }

  private mapRow(row: any): Truck {
    return {
      id: row.id,
      plateNumber: row.plate_number,
      driverName: row.driver_name,
      driverPhone: row.driver_phone,
      arrivalDate: row.arrival_date,
      departureDate: row.departure_date,
      status: row.status as TruckStatus,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }
}
