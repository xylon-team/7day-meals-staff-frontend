import { Customer, CustomerStatus } from '../types/customer';
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
    : item.orders_count ?? item._count?.orders ?? 0;

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

export const getCustomers = async (): Promise<Customer[]> => {
  const response = await fetch(`${API_URL}/customer`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch customers: ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid customer list response');
  return data.map(mapCustomerResponse);
};

export const getCustomerById = async (id: number | string): Promise<Customer> => {
  const response = await fetch(`${API_URL}/customer/${id}`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch customer ${id}: ${response.status}`);
  }

  const data = await response.json();
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Invalid customer ${id} response`);
  }
  return mapCustomerResponse(data);
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

  if (existingCustomer) {
    return {
      ...existingCustomer,
      isActive: false,
      status: 'Inactive',
    };
  }

  // If existingCustomer was not provided, fetch full customer by ID
  const fresh = await getCustomerById(numId);
  return {
    ...fresh,
    isActive: false,
    status: 'Inactive',
  };
};

export const activateCustomer = async (
  id: number | string,
  existingCustomer?: Customer
): Promise<Customer> => {
  const numId = Number(id);
  const response = await fetch(`${API_URL}/customer/${numId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ is_active: true }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Failed to activate customer: ${response.status} ${errorText}`.trim());
  }

  const data = await response.json();
  if (data && typeof data === 'object' && !Array.isArray(data) && data.fname) {
    return mapCustomerResponse(data);
  }
  if (existingCustomer) {
    return {
      ...existingCustomer,
      isActive: true,
      status: 'Active',
    };
  }

  const fresh = await getCustomerById(numId);
  return { ...fresh, isActive: true, status: 'Active' };
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
