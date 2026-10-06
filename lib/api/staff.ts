import { Staff, CreateStaffDto, UpdateStaffDto } from '../types/staff';
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

// Helper to map backend staff object to frontend Staff interface
const mapStaffResponse = (backendStaff: any): Staff => {
  return {
    id: backendStaff.staff_id,
    fname: backendStaff.fname,
    lname: backendStaff.lname,
    phone_number: backendStaff.phone_number,
    status: backendStaff.status,
    email: backendStaff.credential?.email, // if credential included
    role: backendStaff.staff_roles
      ?.map((assignment: { role?: { role?: string } }) => assignment.role?.role)
      .filter(Boolean)
      .join(', ') || 'Staff',
  };
};

/** Fetch the signed-in staff member's canonical identity with their login token. */
export const getMyStaffProfile = async (accessToken: string): Promise<Staff> => {
  const response = await fetch(`${API_URL}/staff-auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || `Error ${response.status}: Failed to fetch your staff profile`);
  }

  return mapStaffResponse(await response.json());
};

export const getStaff = async (): Promise<Staff[]> => {
  const url = new URL(`${API_URL}/staff`);
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || `Error ${response.status}: Failed to fetch staff list`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid staff list response');
  return data.map(mapStaffResponse);
};

export const getStaffById = async (id: number | string): Promise<Staff> => {
  const user = useUserStore.getState().user;
  const isOwnStaffProfile = user?.role !== 'Admin' && String(user?.id) === String(id);
  const url = new URL(`${API_URL}${isOwnStaffProfile ? '/staff-auth/me' : `/staff/${id}`}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || `Error ${response.status}: Failed to fetch staff details`);
  }

  return mapStaffResponse(await response.json());
};

export const createStaff = async (data: CreateStaffDto): Promise<Staff> => {
  const response = await fetch(`${API_URL}/staff`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || `Error ${response.status}: Failed to create staff`);
  }

  return mapStaffResponse(await response.json());
};

export const updateStaff = async (id: number | string, data: UpdateStaffDto): Promise<Staff> => {
  const user = useUserStore.getState().user;
  const isOwnStaffProfile = user?.role !== 'Admin' && String(user?.id) === String(id);
  const url = isOwnStaffProfile
    ? `${API_URL}/staff-auth/me`
    : `${API_URL}/staff/${id}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || `Error ${response.status}: Failed to update staff`);
  }

  const result = await response.json();
  if (result.access_token) useUserStore.getState().setAccessToken(result.access_token);
  return mapStaffResponse(result.staff ?? result);
};

export const deleteStaff = async (id: number | string): Promise<void> => {
  const response = await fetch(`${API_URL}/staff/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || `Error ${response.status}: Failed to delete staff`);
  }
};

export const assignStaffRole = async (staffId: number | string, roleId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/staff/${staffId}/role`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify([roleId]),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || `Error ${response.status}: Failed to assign staff role`);
  }
};

export const removeStaffRole = async (staffId: number | string, roleId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/staff/${staffId}/role/${roleId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || `Error ${response.status}: Failed to remove staff role`);
  }
};

/**
 * Fetches all roles assigned to a staff member and returns a deduplicated,
 * flat list of permission_type strings (e.g. ["inventory_item_add", "supplier_view"]).
 *
 * Uses the admin-token workaround because GET /staff/:id/role is AdminJwtAuthGuard-protected.
 */
export const getStaffPermissions = async (staffId: number | string): Promise<string[]> => {
  try {
    const user = useUserStore.getState().user;
    if (!user || user.role === 'Admin' || String(user.id) !== String(staffId)) return [];
    const response = await fetch(`${API_URL}/staff-auth/me/permissions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch staff roles for id ${staffId}: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.warn(`Error fetching permissions for staff ${staffId}:`, error);
    return [];
  }
};

export const changeOwnStaffPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${API_URL}/staff-auth/me/password`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || `Error ${response.status}: Failed to update password`);
  }
  const result = await response.json();
  if (result.access_token) useUserStore.getState().setAccessToken(result.access_token);
};
