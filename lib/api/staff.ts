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
    role: backendStaff.staff_roles?.[0]?.role?.role || 'User', // fallback role
  };
};

export const getStaff = async (): Promise<Staff[]> => {
  const url = new URL(`${API_URL}/staff`);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch staff');
  }

  const data = await response.json();
  return data.map(mapStaffResponse);
};

export const getStaffById = async (id: number | string): Promise<Staff> => {
  const url = new URL(`${API_URL}/staff/${id}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch staff');
  }

  const data = await response.json();
  return mapStaffResponse(data);
};

export const createStaff = async (data: CreateStaffDto): Promise<Staff> => {
  const response = await fetch(`${API_URL}/staff`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create staff');
  }

  const result = await response.json();
  return mapStaffResponse(result);
};

export const updateStaff = async (id: number | string, data: UpdateStaffDto): Promise<Staff> => {
  const response = await fetch(`${API_URL}/staff/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update staff');
  }

  const result = await response.json();
  return mapStaffResponse(result);
};

export const deleteStaff = async (id: number | string): Promise<void> => {
  const response = await fetch(`${API_URL}/staff/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete staff');
  }
};
