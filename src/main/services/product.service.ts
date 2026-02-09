import { ProductRepository } from '../repositories/product.repository';
import { Product, CreateProductDto, UpdateProductDto } from '../../shared/types/entities';

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
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateProductDto): Product | null {
    const product = this.repo.getById(id);
    if (!product) throw new Error('Product not found');
    return this.repo.update(id, dto);
  }

  delete(id: string): boolean {
    return this.repo.delete(id);
  }
}
