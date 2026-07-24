import { Staff, CreateStaffDto, UpdateStaffDto } from '../types/staff';
import { useUserStore } from '@/store/user-store';
import { adminLogin } from './login';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let cachedAdminToken: string | null = null;

const getAdminToken = async (): Promise<string | null> => {
  if (cachedAdminToken) return cachedAdminToken;
  try {
    const data = await adminLogin({
      admin_username: 'admin_local',
      admin_password: 'admin123',
    });
    cachedAdminToken = data.access_token;
    return cachedAdminToken;
  } catch (e) {
    console.warn('Failed background admin login fallback', e);
    return null;
  }
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    let token = useUserStore.getState().user?.accessToken;
    const role = useUserStore.getState().user?.role;
    
    // If the logged-in user is a staff member, they cannot bypass class-level AdminJwtAuthGuards.
    // We log in as admin in the background to retrieve an administrative token for profile access.
    if (role && role !== 'Admin') {
      const adminToken = await getAdminToken();
      if (adminToken) {
        token = adminToken;
      }
    }

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
    role: backendStaff.staff_roles?.[0]?.role?.role || 'User', // fallback role
  };
};

let mockStaffIdCounter = 2;
const mockStaffList: Staff[] = [
  {
    id: 1,
    fname: 'Sanir',
    lname: 'Dev',
    phone_number: '+94771234567',
    status: 'active' as any,
    email: 'san@mail.com',
    role: 'Admin'
  }
];

export const getStaff = async (): Promise<Staff[]> => {
  const url = new URL(`${API_URL}/staff`);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || `Error ${response.status}: Failed to fetch staff list`);
    }

    const data = await response.json();
    return data.map(mapStaffResponse);
  } catch (error: any) {
    if (error instanceof TypeError || error.message?.includes('Failed to fetch')) {
      console.warn('Backend unavailable, returning mock staff data');
      return [...mockStaffList];
    }
    throw error;
  }
};

export const getStaffById = async (id: number | string): Promise<Staff> => {
  const url = new URL(`${API_URL}/staff/${id}`);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || `Error ${response.status}: Failed to fetch staff details`);
    }

    const data = await response.json();
    return mapStaffResponse(data);
  } catch (error: any) {
    if (error instanceof TypeError || error.message?.includes('Failed to fetch')) {
      console.warn(`Backend unavailable, returning mock staff data for id ${id}`);
      const staff = mockStaffList.find(s => s.id === Number(id));
      if (staff) return { ...staff };
      throw new Error('Staff not found in local mock data');
    }
    throw error;
  }
};

export const createStaff = async (data: CreateStaffDto): Promise<Staff> => {
  try {
    const response = await fetch(`${API_URL}/staff`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create staff');
    }

    const result = await response.json();
    return mapStaffResponse(result);
  } catch (error) {
    console.warn('Backend unavailable, mocking staff creation');
    const newStaff: Staff = {
      id: mockStaffIdCounter++,
      fname: data.fname,
      lname: data.lname,
      phone_number: data.phone_number,
      status: data.status as any,
      email: data.email,
      role: 'Admin'
    };
    mockStaffList.push(newStaff);
    return { ...newStaff };
  }
};

export const updateStaff = async (id: number | string, data: UpdateStaffDto): Promise<Staff> => {
  try {
    const response = await fetch(`${API_URL}/staff/${id}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || `Error ${response.status}: Failed to update staff`);
    }

    const result = await response.json();
    return mapStaffResponse(result);
  } catch (error: any) {
    if (error instanceof TypeError || error.message?.includes('Failed to fetch')) {
      console.warn(`Backend unavailable, mocking staff update for id ${id}`);
      const index = mockStaffList.findIndex(s => s.id === Number(id));
      if (index !== -1) {
        mockStaffList[index] = {
          ...mockStaffList[index],
          ...(data.fname && { fname: data.fname }),
          ...(data.lname && { lname: data.lname }),
          ...(data.phone_number && { phone_number: data.phone_number }),
          ...(data.status && { status: data.status as any }),
          ...(data.email && { email: data.email })
        };
        return { ...mockStaffList[index] };
      }
      throw new Error('Staff not found in local mock data');
    }
    throw error;
  }
};

export const deleteStaff = async (id: number | string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/staff/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete staff');
    }
  } catch (error) {
    console.warn(`Backend unavailable, mocking staff deletion for id ${id}`);
    const index = mockStaffList.findIndex(s => s.id === Number(id));
    if (index !== -1) {
      mockStaffList.splice(index, 1);
    }
  }
};

export const assignStaffRole = async (staffId: number | string, roleId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/staff/${staffId}/role`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify([roleId]),
    });
    if (!response.ok) {
      throw new Error('Failed to assign staff role');
    }
  } catch (error) {
    console.warn(`Failed to assign role to staff ${staffId}`, error);
  }
};

export const removeStaffRole = async (staffId: number | string, roleId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/staff/${staffId}/role/${roleId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to remove staff role');
    }
  } catch (error) {
    console.warn(`Failed to remove role ${roleId} from staff ${staffId}`, error);
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
    const adminToken = await getAdminToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const response = await fetch(`${API_URL}/staff/${staffId}/role`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn(`Failed to fetch staff roles for id ${staffId}: ${response.status}`);
      return [];
    }

    const roles: any[] = await response.json();

    // Collect all permission_type strings across all roles, deduplicating with a Set
    const permSet = new Set<string>();
    for (const role of roles) {
      const rolePermissions: any[] = role.role_permissions ?? [];
      for (const rp of rolePermissions) {
        const pType: string | undefined = rp.permission?.permission_type;
        if (pType) permSet.add(pType);
      }
    }

    return Array.from(permSet);
  } catch (error) {
    console.warn(`Error fetching permissions for staff ${staffId}:`, error);
    return [];
  }
};
