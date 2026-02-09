import { TruckStatus, UnitType, InvoiceStatus, BackupType } from './enums';

export interface Truck {
  id: string;
  plateNumber: string;
  driverName: string | null;
  driverPhone: string | null;
  arrivalDate: string;
  departureDate: string | null;
  status: TruckStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  variety: string | null;
  defaultUnitType: UnitType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  isTemporary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  truckId: string;
  productId: string;
  customerId: string | null;
  invoiceId: string | null;
  unitType: UnitType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaleWithDetails extends Sale {
  truckPlateNumber: string;
  productName: string;
  customerName: string | null;
  invoiceNumber: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceWithDetails extends Invoice {
  customerName: string;
  sales: SaleWithDetails[];
}

export interface BackupLog {
  id: string;
  filePath: string;
  type: BackupType;
  sizeBytes: number;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

// DTOs for creating/updating
export interface CreateTruckDto {
  plateNumber: string;
  driverName?: string;
  driverPhone?: string;
  arrivalDate?: string;
  notes?: string;
}

export interface UpdateTruckDto {
  plateNumber?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
}

export interface CreateProductDto {
  name: string;
  variety?: string;
  defaultUnitType: UnitType;
}

export interface UpdateProductDto {
  name?: string;
  variety?: string;
  defaultUnitType?: UnitType;
  isActive?: boolean;
}

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  address?: string;
  taxId?: string;
  isTemporary?: boolean;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  isTemporary?: boolean;
  isActive?: boolean;
}

export interface CreateSaleDto {
  truckId: string;
  productId: string;
  customerId?: string;
  unitType: UnitType;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface UpdateSaleDto {
  customerId?: string | null;
  unitType?: UnitType;
  quantity?: number;
  unitPrice?: number;
  notes?: string;
}

export interface CreateInvoiceDto {
  customerId: string;
  saleIds: string[];
  notes?: string;
  dueDate?: string;
}

export interface UpdateInvoiceDto {
  status?: InvoiceStatus;
  notes?: string;
  dueDate?: string;
}

// Report types
export interface DailySummary {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalTrucks: number;
}

export interface ProductSummary {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  saleCount: number;
}

export interface CustomerSummary {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  totalAmount: number;
}

export interface TruckSummary {
  truckId: string;
  plateNumber: string;
  arrivalDate: string;
  totalSales: number;
  totalRevenue: number;
}
