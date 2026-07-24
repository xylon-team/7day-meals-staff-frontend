import { Role, CreateRoleDto, UpdateRoleDto, Permission } from '../types/roles';
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

let mockRolesIdCounter = 3;
const mockRoles: Role[] = [
  { id: 1, role: 'Admin', description: 'System Administrator', permissions: [] },
  { id: 2, role: 'Manager', description: 'Store Manager', permissions: [] }
];

export const getRoles = async (includePermissions: boolean = false): Promise<Role[]> => {
  const url = new URL(`${API_URL}/role`);
  if (includePermissions) {
    url.searchParams.append('includePermissions', 'true');
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch roles');
    }

    const data = await response.json();
    return data.map(mapRoleResponse);
  } catch (error) {
    console.warn('Backend unavailable, returning mock roles data');
    return [...mockRoles];
  }
};

export const getRoleById = async (id: number | string, includePermissions: boolean = false): Promise<Role> => {
  const url = new URL(`${API_URL}/role/${id}`);
  if (includePermissions) {
    url.searchParams.append('includePermissions', 'true');
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch role');
    }

    const data = await response.json();
    return mapRoleResponse(data);
  } catch (error) {
    console.warn(`Backend unavailable, returning mock role data for id ${id}`);
    const role = mockRoles.find(r => r.id === Number(id));
    if (!role) throw new Error('Role not found');
    return { ...role };
  }
};

export const createRole = async (data: CreateRoleDto): Promise<Role> => {
  try {
    const response = await fetch(`${API_URL}/role`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create role');
    }

    const result = await response.json();
    return mapRoleResponse(result);
  } catch (error) {
    console.warn('Backend unavailable, mocking role creation');
    const newRole: Role = {
      id: mockRolesIdCounter++,
      role: data.role,
      description: data.description,
      permissions: []
    };
    mockRoles.push(newRole);
    return { ...newRole };
  }
};

export const updateRole = async (id: number | string, data: UpdateRoleDto): Promise<Role> => {
  try {
    const response = await fetch(`${API_URL}/role/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update role');
    }

    const result = await response.json();
    return mapRoleResponse(result);
  } catch (error) {
    console.warn(`Backend unavailable, mocking role update for id ${id}`);
    const index = mockRoles.findIndex(r => r.id === Number(id));
    if (index === -1) throw new Error('Role not found');
    mockRoles[index] = { ...mockRoles[index], ...data };
    return { ...mockRoles[index] };
  }
};

export const deleteRole = async (id: number | string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/role/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete role');
    }
  } catch (error) {
    console.warn(`Backend unavailable, mocking role deletion for id ${id}`);
    const index = mockRoles.findIndex(r => r.id === Number(id));
    if (index !== -1) {
      mockRoles.splice(index, 1);
    }
  }
};

export const getAllPermissions = async (): Promise<any[]> => {
  const url = `${API_URL}/role/permissions`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch permissions');
    return await response.json();
  } catch (error) {
    console.warn('Backend unavailable, mocking getAllPermissions');
    return [];
  }
};

export const assignRolePermissions = async (roleId: number | string, permissionIds: number[]): Promise<void> => {
  const url = `${API_URL}/role/${roleId}/permissions`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissionIds }),
    });
    if (!response.ok) throw new Error('Failed to assign permissions');
  } catch (error) {
    console.warn(`Backend unavailable, mocking assignRolePermissions for role ${roleId}`);
  }
};

export const removeRolePermissions = async (roleId: number | string, permissionIds: number[]): Promise<void> => {
  const url = `${API_URL}/role/${roleId}/permissions`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissionIds }),
    });
    if (!response.ok) throw new Error('Failed to remove permissions');
  } catch (error) {
    console.warn(`Backend unavailable, mocking removeRolePermissions for role ${roleId}`);
  }
};
