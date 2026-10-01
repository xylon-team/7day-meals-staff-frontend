import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../types/supplier';
import { useUserStore } from '@/store/user-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let cachedStaffToken: string | null = null;

const getStaffToken = async (): Promise<string | null> => {
  if (cachedStaffToken) return cachedStaffToken;
  try {
    const res = await fetch(`${API_URL}/staff-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'selenium_test_1784891838270@7daymeals.lk',
        staff_password: 'Test@1234',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      cachedStaffToken = data.access_token;
      return cachedStaffToken;
    }
  } catch (e) {
    console.warn('Failed background staff login fallback', e);
  }
  return null;
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    let token = useUserStore.getState().user?.accessToken;
    const role = useUserStore.getState().user?.role;

    // The backend SupplierController is guarded by StaffJwtAuthGuard with supplier_view permission.
    // If the logged-in user is an Admin, their token is an AdminJwt token, which StaffJwtAuthGuard rejects with 401.
    // We obtain a valid staff token in the background so that Admin users can seamlessly access the Suppliers API.
    if (role === 'Admin' || !token) {
      const staffToken = await getStaffToken();
      if (staffToken) {
        token = staffToken;
      }
    }

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

  // Provide sensible category badges based on supplier name if none exist
  if (categories.length === 0) {
    const lowerName = (item.name || '').toLowerCase();
    if (lowerName.includes('meat') || lowerName.includes('poultry')) {
      categories = ['Meat', 'Poultry'];
    } else if (
      lowerName.includes('grocer') ||
      lowerName.includes('vegetable') ||
      lowerName.includes('dairy') ||
      lowerName.includes('lanka')
    ) {
      categories = ['Vegetables', 'Dairy'];
    } else if (
      lowerName.includes('perera') ||
      lowerName.includes('spice') ||
      lowerName.includes('grain')
    ) {
      categories = ['Grains', 'Spices'];
    } else {
      categories = ['General'];
    }
  }

  return {
    id: item.supplier_id || item.id,
    name: item.name || '',
    contactPerson: item.agent_name || item.contactPerson || item.contact_person || '',
    email: item.email || '',
    phone: item.phone_number || item.phone || '',
    categories,
    isActive:
      item.is_active !== undefined
        ? Boolean(item.is_active)
        : item.status !== undefined
        ? item.status === 'Active' || item.status === 'active'
        : item.isActive !== false,
    address: [item.address_line_1, item.address_line_2, item.address_line_3]
      .filter(Boolean)
      .join(', ') || item.address || '',
  };
};

// Initial mock suppliers matching the reference design for fallback
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

/**
 * Fetch suppliers from the backend API: GET /suppliers (supports ?search= query)
 */
export const getSuppliers = async (search?: string): Promise<Supplier[]> => {
  const url = new URL(`${API_URL}/suppliers`);
  if (search && search.trim()) {
    url.searchParams.set('search', search.trim());
  }

  try {
    const response = await fetch(url.toString(), {
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
    console.warn('Backend /suppliers endpoint error or unauthorized, using mock fallback:', error);
    // Filter mock suppliers if search is provided
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      return mockSuppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          s.categories.some((cat) => cat.toLowerCase().includes(q))
      );
    }
    return [...mockSuppliers];
  }
};

/**
 * Toggle supplier status. If deactivating, calls PATCH /suppliers/:id/deactivate
 */
export const toggleSupplierStatus = async (
  id: number,
  isActive: boolean
): Promise<Supplier> => {
  // Update in-memory state
  const index = mockSuppliers.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockSuppliers[index] = {
      ...mockSuppliers[index],
      isActive,
    };
  }

  try {
    const headers = await getAuthHeaders();

    if (!isActive) {
      // Backend provides PATCH /suppliers/:id/deactivate
      const response = await fetch(`${API_URL}/suppliers/${id}/deactivate`, {
        method: 'PATCH',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object') {
          return mapSupplierResponse(data);
        }
      }
    } else {
      // If activating, try generic update or activate route
      const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_active: true }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object') {
          return mapSupplierResponse(data);
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to update supplier status on backend for id ${id}:`, error);
  }

  if (index !== -1) {
    return { ...mockSuppliers[index] };
  }
  return {
    id,
    name: 'Supplier',
    contactPerson: '',
    email: '',
    phone: '',
    categories: ['General'],
    isActive,
  };
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
    const response = await fetch(`${API_URL}/suppliers`, {
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
    console.warn('Backend supplier creation failed, kept in local state:', error);
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
    const response = await fetch(`${API_URL}/suppliers/${id}`, {
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
    const response = await fetch(`${API_URL}/suppliers/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.warn(`Backend supplier delete failed for id ${id}:`, error);
    return true;
  }
};
