export type CustomerStatus = 'Active' | 'Inactive';

export interface Customer {
  id: number;
  fname: string;
  lname: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  registeredDate: string;
  status: CustomerStatus;
  isActive: boolean;
}

export interface UpdateCustomerDto {
  fname?: string;
  lname?: string;
  phone_number?: string;
  address_line_1?: string;
  address_line_2?: string;
  is_active?: boolean;
}
