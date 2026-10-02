export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  categories: string[];
  isActive: boolean;
  address?: string;
}

export interface CreateSupplierDto {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  categories: string[];
  isActive?: boolean;
  address?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  categories?: string[];
  isActive?: boolean;
  address?: string;
}
