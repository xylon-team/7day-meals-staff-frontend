import { Role, CreateRoleDto, UpdateRoleDto } from '../types/roles';
import { useUserStore } from '@/store/user-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = useUserStore.getState().user?.accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Map backend response format to frontend format
const mapRoleResponse = (backendRole: any): Role => {
  return {
    id: backendRole.role_id,
    role: backendRole.role,
    description: backendRole.description,
    permissions: backendRole.role_permissions 
      ? backendRole.role_permissions.map((rp: any) => rp.permission)
      : [],
  };
};

export const getRoles = async (includePermissions: boolean = false): Promise<Role[]> => {
  const url = new URL(`${API_URL}/role`);
  if (includePermissions) {
    url.searchParams.append('includePermissions', 'true');
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error(`Failed to fetch roles: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid role list response');
  return data.map(mapRoleResponse);
};

export const getRoleById = async (id: number | string, includePermissions: boolean = false): Promise<Role> => {
  const url = new URL(`${API_URL}/role/${id}`);
  if (includePermissions) {
    url.searchParams.append('includePermissions', 'true');
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error(`Failed to fetch role ${id}: ${response.status}`);
  return mapRoleResponse(await response.json());
};

export const createRole = async (data: CreateRoleDto): Promise<Role> => {
  const response = await fetch(`${API_URL}/role`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(`Failed to create role: ${response.status}`);
  return mapRoleResponse(await response.json());
};

export const updateRole = async (id: number | string, data: UpdateRoleDto): Promise<Role> => {
  const response = await fetch(`${API_URL}/role/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(`Failed to update role ${id}: ${response.status}`);
  return mapRoleResponse(await response.json());
};

export const deleteRole = async (id: number | string): Promise<void> => {
  const response = await fetch(`${API_URL}/role/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error(`Failed to delete role ${id}: ${response.status}`);
};

export const getAllPermissions = async (): Promise<any[]> => {
  const url = `${API_URL}/role/permissions`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch permissions: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid permissions response');
  return data;
};

export const assignRolePermissions = async (roleId: number | string, permissionIds: number[]): Promise<void> => {
  const url = `${API_URL}/role/${roleId}/permissions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ permissionIds }),
  });
  if (!response.ok) throw new Error(`Failed to assign permissions to role ${roleId}: ${response.status}`);
};

export const removeRolePermissions = async (roleId: number | string, permissionIds: number[]): Promise<void> => {
  const url = `${API_URL}/role/${roleId}/permissions`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ permissionIds }),
  });
  if (!response.ok) throw new Error(`Failed to remove permissions from role ${roleId}: ${response.status}`);
};
