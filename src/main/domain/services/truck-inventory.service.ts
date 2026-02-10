import { v4 as uuidv4 } from 'uuid';
import { TruckInventoryRepository } from '../../repositories/truck-inventory.repository';
import { SaleRepository } from '../../repositories/sale.repository';
import { TruckInventory, CreateTruckInventoryDto, UpdateTruckInventoryDto } from '../../../shared/types/entities';

/**
 * TruckInventoryService
 * Manages product inventory in trucks
 * Tracks what products are in each truck and quantities
 */
export class TruckInventoryService {
  constructor(
    private inventoryRepo: TruckInventoryRepository,
    private saleRepo: SaleRepository
  ) {}

  /**
   * Add product to truck inventory
   */
  addProduct(truckId: string, dto: CreateTruckInventoryDto): TruckInventory {
    // Check if product already in truck, if so update quantity
    const existing = this.inventoryRepo.getByTruckAndProduct(truckId, dto.productId);
    if (existing) {
      return this.inventoryRepo.update(existing.id, {
        quantity: existing.quantity + dto.quantity,
        unitType: dto.unitType
      })!;
    }

    return this.inventoryRepo.create(truckId, dto);
  }

  /**
   * Get inventory for a truck
   */
  getTruckInventory(truckId: string): TruckInventory[] {
    return this.inventoryRepo.getByTruck(truckId);
  }

  /**
   * Get remaining quantity of a product in truck
   * Accounts for sales already made
   */
  getRemainingQuantity(truckId: string, productId: string): number {
    const inventory = this.inventoryRepo.getByTruckAndProduct(truckId, productId);
    if (!inventory) return 0;

    // Get all sales for this truck/product
    const sales = this.saleRepo.getByTruck(truckId)
      .filter(s => s.productId === productId);

    const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);
    return Math.max(0, inventory.quantity - totalSold);
  }

  /**
   * Decrease inventory when sale is made
   */
  decreaseInventory(truckId: string, productId: string, quantity: number): TruckInventory | null {
    const remaining = this.getRemainingQuantity(truckId, productId);
    if (remaining < quantity) {
      throw new Error(
        `Insufficient inventory: trying to sell ${quantity} but only ${remaining} available`
      );
    }

    const inventory = this.inventoryRepo.getByTruckAndProduct(truckId, productId);
    if (!inventory) return null;

    // Actually we update inventory in sales table, not here
    // This method is for validation and reading remaining
    return inventory;
  }

  /**
   * Update product quantity in truck
   */
  updateQuantity(truckId: string, productId: string, newQuantity: number): TruckInventory | null {
    return this.inventoryRepo.updateQuantity(truckId, productId, newQuantity);
  }

  /**
   * Remove a product from truck inventory
   */
  removeProduct(truckId: string, productId: string): boolean {
    return this.inventoryRepo.deleteByTruckAndProduct(truckId, productId);
  }

  /**
   * Clear all inventory from truck (when truck is closed)
   */
  clearTruckInventory(truckId: string): number {
    return this.inventoryRepo.deleteByTruck(truckId);
  }
}
