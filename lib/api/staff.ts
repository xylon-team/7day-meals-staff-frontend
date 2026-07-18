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
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch staff');
    }

    const data = await response.json();
    return data.map(mapStaffResponse);
  } catch (error) {
    console.warn('Backend unavailable, returning mock staff data');
    return [...mockStaffList];
  }
};

export const getStaffById = async (id: number | string): Promise<Staff> => {
  const url = new URL(`${API_URL}/staff/${id}`);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch staff');
    }

    const data = await response.json();
    return mapStaffResponse(data);
  } catch (error) {
    console.warn(`Backend unavailable, returning mock staff data for id ${id}`);
    const staff = mockStaffList.find(s => s.id === Number(id));
    if (!staff) throw new Error('Staff not found');
    return { ...staff };
  }
};

export const createStaff = async (data: CreateStaffDto): Promise<Staff> => {
  try {
    const response = await fetch(`${API_URL}/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update staff');
    }

    const result = await response.json();
    return mapStaffResponse(result);
  } catch (error) {
    console.warn(`Backend unavailable, mocking staff update for id ${id}`);
    const index = mockStaffList.findIndex(s => s.id === Number(id));
    if (index === -1) throw new Error('Staff not found');
    const existing = mockStaffList[index];
    mockStaffList[index] = {
      ...existing,
      ...(data.fname && { fname: data.fname }),
      ...(data.lname && { lname: data.lname }),
      ...(data.phone_number && { phone_number: data.phone_number }),
      ...(data.status && { status: data.status as any }),
      ...(data.email && { email: data.email })
    };
    return { ...mockStaffList[index] };
  }
};

export const deleteStaff = async (id: number | string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/staff/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
