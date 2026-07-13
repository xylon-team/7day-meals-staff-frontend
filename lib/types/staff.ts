export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface Staff {
  id: number; // mapped from staff_id
  fname: string;
  lname: string;
  phone_number: string;
  status: StaffStatus;
  email?: string; // mapped from staff_credential (if available)
  role?: string; // not available yet, but mapped for frontend convenience
}

export interface CreateStaffDto {
  fname: string;
  lname: string;
  phone_number: string;
  status: StaffStatus;
  email: string;
  staff_password?: string; // only for create/update
}

export interface UpdateStaffDto {
  fname?: string;
  lname?: string;
  phone_number?: string;
  status?: StaffStatus;
  email?: string;
  staff_password?: string;
}
