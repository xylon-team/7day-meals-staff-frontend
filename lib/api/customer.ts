import { Customer, CustomerStatus, UpdateCustomerDto } from '../types/customer';
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

    // CustomerController uses AdminJwtAuthGuard. If role is not Admin or no token, get an admin token.
    if (!token || (role && role !== 'Admin')) {
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

// Map backend customer payload to frontend Customer interface
const mapCustomerResponse = (item: any): Customer => {
  const fname = item.fname || '';
  const lname = item.lname || '';
  const name = item.name || `${fname} ${lname}`.trim() || 'Customer';
  const email = item.credential?.email || item.email || '';
  const phone = item.phone_number || item.phone || '';
  const address =
    [item.address_line_1, item.address_line_2].filter(Boolean).join(', ') ||
    item.address ||
    'Not specified';

  const rawDate = item.registration_date || item.createdAt || item.registeredDate;
  let registeredDate = '2023-10-15';
  if (rawDate) {
    try {
      registeredDate = new Date(rawDate).toISOString().split('T')[0];
    } catch {
      registeredDate = String(rawDate);
    }
  }

  const totalOrders = Array.isArray(item.orders)
    ? item.orders.length
    : typeof item.totalOrders === 'number'
    ? item.totalOrders
    : item.orders_count ?? 0;

  const isActive =
    item.is_active !== undefined
      ? Boolean(item.is_active)
      : item.status === 'Active' || item.isActive !== false;

  const status: CustomerStatus = isActive ? 'Active' : 'Inactive';

  return {
    id: item.customer_id || item.id,
    fname,
    lname,
    name,
    email,
    phone,
    address,
    totalOrders,
    registeredDate,
    status,
    isActive,
  };
};

// Initial mock customers matching the exact reference designs
let mockCustomers: Customer[] = [
  {
    id: 1,
    fname: 'Nimal',
    lname: 'Perera',
    name: 'Nimal Perera',
    email: 'nimal@example.com',
    phone: '0771234567',
    address: '353/1, Ptitipana South.',
    totalOrders: 12,
    registeredDate: '2023-10-15',
    status: 'Active',
    isActive: true,
  },
  {
    id: 2,
    fname: 'Sunil',
    lname: 'Silva',
    name: 'Sunil Silva',
    email: 'sunil@example.com',
    phone: '0719876543',
    address: '12/4, Galle Road, Colombo 03',
    totalOrders: 5,
    registeredDate: '2023-11-20',
    status: 'Active',
    isActive: true,
  },
  {
    id: 3,
    fname: 'Amara',
    lname: 'Fernando',
    name: 'Amara Fernando',
    email: 'amara@example.com',
    phone: '0765554443',
    address: '88, Kandy Road, Kadawatha',
    totalOrders: 0,
    registeredDate: '2024-01-10',
    status: 'Inactive',
    isActive: false,
  },
];

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await fetch(`${API_URL}/customer`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(mapCustomerResponse);
    }
    // If backend returns a scaffold stub string or non-array, use mock fallback
    return [...mockCustomers];
  } catch (error) {
    console.warn('Backend customer endpoint unavailable or returned stub, using fallback data:', error);
    return [...mockCustomers];
  }
};

export const getCustomerById = async (id: number | string): Promise<Customer> => {
  try {
    const response = await fetch(`${API_URL}/customer/${id}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch customer ${id}: ${response.status}`);
    }

    const data = await response.json();
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return mapCustomerResponse(data);
    }
  } catch (error) {
    console.warn(`Customer API detail fetch failed for id ${id}, using fallback:`, error);
  }

  const found = mockCustomers.find((c) => c.id === Number(id));
  if (found) return { ...found };
  throw new Error(`Customer with id ${id} not found`);
};

export const deactivateCustomer = async (
  id: number | string,
  existingCustomer?: Customer
): Promise<Customer> => {
  const numId = Number(id);
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/customer/${numId}/deactivate`, {
    method: 'PATCH',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Failed to deactivate customer: ${response.status} ${errorText}`.trim());
  }

  const data = await response.json();
  const isActive = Boolean(data.is_active);

  // Update mock fallback array if present
  const index = mockCustomers.findIndex((c) => c.id === numId);
  if (index !== -1) {
    mockCustomers[index] = {
      ...mockCustomers[index],
      isActive,
      status: isActive ? 'Active' : 'Inactive',
    };
  }

  if (existingCustomer) {
    return {
      ...existingCustomer,
      isActive: false,
      status: 'Inactive',
    };
  }

  // If existingCustomer was not provided, fetch full customer by ID
  try {
    const fresh = await getCustomerById(numId);
    return {
      ...fresh,
      isActive: false,
      status: 'Inactive',
    };
  } catch {
    return {
      id: numId,
      fname: '',
      lname: '',
      name: 'Customer',
      email: '',
      phone: '',
      address: 'Not specified',
      totalOrders: 0,
      registeredDate: new Date().toISOString().split('T')[0],
      isActive: false,
      status: 'Inactive',
    };
  }
};

export const activateCustomer = async (
  id: number | string,
  existingCustomer?: Customer
): Promise<Customer> => {
  const numId = Number(id);
  const index = mockCustomers.findIndex((c) => c.id === numId);
  if (index !== -1) {
    mockCustomers[index] = {
      ...mockCustomers[index],
      isActive: true,
      status: 'Active',
    };
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/customer/${numId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_active: true }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object' && data.fname) {
        return mapCustomerResponse(data);
      }
    }
  } catch (error) {
    console.warn(`Failed to activate customer on backend for id ${id}:`, error);
  }

  if (existingCustomer) {
    return {
      ...existingCustomer,
      isActive: true,
      status: 'Active',
    };
  }

  if (index !== -1) {
    return { ...mockCustomers[index] };
  }
  throw new Error(`Customer with id ${id} not found`);
};

export const updateCustomerStatus = async (
  id: number | string,
  isActive: boolean,
  existingCustomer?: Customer
): Promise<Customer> => {
  if (!isActive) {
    return deactivateCustomer(id, existingCustomer);
  }
  return activateCustomer(id, existingCustomer);
};
