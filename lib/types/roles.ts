export interface Permission {
  id: number;
  action: string;
  subject: string;
  description?: string;
}

export interface Role {
  id: number;
  role: string;
  description: string;
  permissions?: Permission[];
}

export interface CreateRoleDto {
  role: string;
  description: string;
}

export interface UpdateRoleDto {
  role?: string;
  description?: string;
}
