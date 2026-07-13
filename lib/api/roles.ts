import { Role, CreateRoleDto, UpdateRoleDto } from '../types/roles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch roles');
  }

  return response.json();
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch role');
  }

  return response.json();
};

export const createRole = async (data: CreateRoleDto): Promise<Role> => {
  const response = await fetch(`${API_URL}/role`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create role');
  }

  return response.json();
};

export const updateRole = async (id: number | string, data: UpdateRoleDto): Promise<Role> => {
  const response = await fetch(`${API_URL}/role/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update role');
  }

  return response.json();
};

export const deleteRole = async (id: number | string): Promise<void> => {
  const response = await fetch(`${API_URL}/role/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete role');
  }
};
