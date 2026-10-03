export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  isActive: boolean;
  address?: string;
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  categories?: string[];
}

export interface CreateSupplierDto {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  isActive?: boolean;
  address?: string;
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  categories?: string[];
}

export interface UpdateSupplierDto {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  address?: string;
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  categories?: string[];
}
