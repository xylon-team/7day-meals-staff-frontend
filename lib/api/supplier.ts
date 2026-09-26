import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../types/supplier';
import { useUserStore } from '@/store/user-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
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

// Map backend supplier payload to frontend Supplier interface
const mapSupplierResponse = (item: any): Supplier => {
  let categories: string[] = [];
  if (Array.isArray(item.categories)) {
    categories = item.categories;
  } else if (Array.isArray(item.inventory_items)) {
    categories = Array.from(
      new Set(
        item.inventory_items
          .map((i: any) => i.inventory?.category || i.category)
          .filter(Boolean)
      )
    ) as string[];
  }

  return {
    id: item.supplier_id || item.id,
    name: item.name || '',
    contactPerson: item.agent_name || item.contactPerson || item.contact_person || '',
    email: item.email || '',
    phone: item.phone_number || item.phone || '',
    categories: categories.length > 0 ? categories : ['General'],
    isActive:
      item.is_active !== undefined
        ? Boolean(item.is_active)
        : item.status !== undefined
        ? item.status === 'Active' || item.status === 'active'
        : item.isActive !== false,
    address: item.address_line_1 || item.address || '',
  };
};

// Initial mock suppliers matching the reference design
let mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'Perera Distributors',
    contactPerson: 'Kamal Perera',
    email: 'kamal@pereradist.lk',
    phone: '0771112223',
    categories: ['Grains', 'Spices'],
    isActive: true,
    address: 'Colombo 10',
  },
  {
    id: 2,
    name: 'Fresh Meats Co.',
    contactPerson: 'Nimal Silva',
    email: 'sales@freshmeats.lk',
    phone: '0719998887',
    categories: ['Meat', 'Poultry'],
    isActive: true,
    address: 'Negombo',
  },
  {
    id: 3,
    name: 'Lanka Grocers',
    contactPerson: 'Amara Fernando',
    email: 'amara@lankagrocers.lk',
    phone: '0765554443',
    categories: ['Vegetables', 'Dairy'],
    isActive: false,
    address: 'Kandy Road, Kadawatha',
  },
];

let supplierIdCounter = 4;

export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const response = await fetch(`${API_URL}/supplier`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch suppliers: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(mapSupplierResponse);
    }
    return [...mockSuppliers];
  } catch (error) {
    console.warn('Backend supplier endpoint unavailable, using mock fallback:', error);
    return [...mockSuppliers];
  }
};

export const toggleSupplierStatus = async (
  id: number,
  isActive: boolean
): Promise<Supplier> => {
  const index = mockSuppliers.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockSuppliers[index] = {
      ...mockSuppliers[index],
      isActive,
    };
  }

  try {
    const response = await fetch(`${API_URL}/supplier/${id}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ is_active: isActive }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        return mapSupplierResponse(data);
      }
    }
  } catch (error) {
    console.warn(`Failed to update supplier status on backend for id ${id}:`, error);
  }

  if (index !== -1) {
    return { ...mockSuppliers[index] };
  }
  throw new Error(`Supplier with id ${id} not found`);
};

export const createSupplier = async (
  dto: CreateSupplierDto
): Promise<Supplier> => {
  const newSupplier: Supplier = {
    id: supplierIdCounter++,
    name: dto.name,
    contactPerson: dto.contactPerson,
    email: dto.email,
    phone: dto.phone,
    categories: dto.categories.length > 0 ? dto.categories : ['General'],
    isActive: dto.isActive ?? true,
    address: dto.address || '',
  };

  mockSuppliers = [newSupplier, ...mockSuppliers];

  try {
    const response = await fetch(`${API_URL}/supplier`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        name: dto.name,
        agent_name: dto.contactPerson,
        email: dto.email,
        phone_number: dto.phone,
        address_line_1: dto.address,
        is_active: dto.isActive ?? true,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        return mapSupplierResponse(data);
      }
    }
  } catch (error) {
    console.warn('Backend supplier creation failed, added to local mock:', error);
  }

  return newSupplier;
};

export const updateSupplier = async (
  id: number,
  dto: UpdateSupplierDto
): Promise<Supplier> => {
  const index = mockSuppliers.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockSuppliers[index] = {
      ...mockSuppliers[index],
      ...dto,
      categories: dto.categories ?? mockSuppliers[index].categories,
      isActive: dto.isActive ?? mockSuppliers[index].isActive,
    };
  }

  try {
    const response = await fetch(`${API_URL}/supplier/${id}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        name: dto.name,
        agent_name: dto.contactPerson,
        email: dto.email,
        phone_number: dto.phone,
        address_line_1: dto.address,
        is_active: dto.isActive,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        return mapSupplierResponse(data);
      }
    }
  } catch (error) {
    console.warn(`Backend supplier update failed for id ${id}:`, error);
  }

  if (index !== -1) {
    return { ...mockSuppliers[index] };
  }
  throw new Error(`Supplier with id ${id} not found`);
};

export const deleteSupplier = async (id: number): Promise<boolean> => {
  mockSuppliers = mockSuppliers.filter((s) => s.id !== id);

  try {
    const response = await fetch(`${API_URL}/supplier/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.warn(`Backend supplier delete failed for id ${id}:`, error);
    return true;
  }
};
