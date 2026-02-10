import { ProductRepository } from '../repositories/product.repository';
import { Product, CreateProductDto, UpdateProductDto } from '../../shared/types/entities';
import { auditService } from './AuditService';

export class ProductService {
  private repo = new ProductRepository();

  getAll(): Product[] {
    return this.repo.getAll();
  }

  getActive(): Product[] {
    return this.repo.getActive();
  }

  getById(id: string): Product | null {
    return this.repo.getById(id);
  }

  create(dto: CreateProductDto): Product {
    if (!dto.name?.trim()) {
      throw new Error('Product name is required');
    }
    const product = this.repo.create(dto);
    auditService.log('Product', product.id, 'CREATE', null, JSON.stringify(dto));
    return product;
  }

  update(id: string, dto: UpdateProductDto): Product | null {
    const product = this.repo.getById(id);
    if (!product) throw new Error('Product not found');
    const updated = this.repo.update(id, dto);
    if (updated) {
      auditService.log('Product', id, 'UPDATE', null, JSON.stringify(dto));
    }
    return updated;
  }

  delete(id: string): boolean {
    const success = this.repo.delete(id);
    if (success) {
      auditService.log('Product', id, 'DELETE', null);
    }
    return success;
  }
}
