import { 
  Payment, 
  PaymentDto,
} from '../../shared/types/entities';
import { PaymentRepository } from '../repositories/payment.repository';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { InvoiceStatus } from '../../shared/types/enums';

export class PaymentService {
  private paymentRepo = new PaymentRepository();
  private invoiceRepo = new InvoiceRepository();

  create(dto: PaymentDto): Payment {
    const invoice = this.invoiceRepo.getById(dto.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Cannot create payment for cancelled invoice');
    }

    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new Error('Cannot create payment for draft invoice. Issue it first.');
    }

    return this.paymentRepo.create(dto);
  }

  getById(id: string): Payment | null {
    return this.paymentRepo.getById(id);
  }

  getByInvoiceId(invoiceId: string): Payment[] {
    return this.paymentRepo.getByInvoiceId(invoiceId);
  }

  getAll(): Payment[] {
    return this.paymentRepo.getAll();
  }

  delete(id: string): boolean {
    return this.paymentRepo.delete(id);
  }

  /**
   * Get total paid amount for an invoice
   */
  getTotalPayedAmount(invoiceId: string): number {
    const payments = this.getByInvoiceId(invoiceId);
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }

  /**
   * Get remaining amount due for an invoice
   */
  getRemainingAmount(invoiceId: string): number {
    const invoice = this.invoiceRepo.getById(invoiceId);
    if (!invoice) return 0;

    const paidAmount = this.getTotalPayedAmount(invoiceId);
    return Math.max(0, invoice.netTotal - paidAmount);
  }
}
