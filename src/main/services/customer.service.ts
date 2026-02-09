import { CustomerRepository } from '../repositories/customer.repository';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../../shared/types/entities';

export class CustomerService {
  private repo = new CustomerRepository();

  getAll(): Customer[] {
    return this.repo.getAll();
  }

  getActive(): Customer[] {
    return this.repo.getActive();
  }

  getById(id: string): Customer | null {
    return this.repo.getById(id);
  }

  create(dto: CreateCustomerDto): Customer {
    if (!dto.name?.trim()) {
      throw new Error('Customer name is required');
    }
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateCustomerDto): Customer | null {
    const customer = this.repo.getById(id);
    if (!customer) throw new Error('Customer not found');
    return this.repo.update(id, dto);
  }

  delete(id: string): boolean {
    return this.repo.delete(id);
  }
}
