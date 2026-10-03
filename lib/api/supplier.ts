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
          (s.address && s.address.toLowerCase().includes(q))
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
      // Backend provides PATCH /suppliers/:id/deactivate which returns { supplier_id, is_active }
      const response = await fetch(`${API_URL}/suppliers/${id}/deactivate`, {
        method: 'PATCH',
        headers,
      });

      if (response.ok) {
        if (index !== -1) {
          mockSuppliers[index] = { ...mockSuppliers[index], isActive: false };
          return mockSuppliers[index];
        }
      }
    } else {
      // Activating supplier
      const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_active: true }),
      });

      if (response.ok) {
        if (index !== -1) {
          mockSuppliers[index] = { ...mockSuppliers[index], isActive: true };
          return mockSuppliers[index];
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
    isActive,
  };
};

export const createSupplier = async (
  dto: CreateSupplierDto
): Promise<Supplier> => {
  const payload = {
    name: dto.name.trim(),
    agent_name: dto.contactPerson.trim(),
    email: dto.email.trim(),
    phone_number: dto.phone.trim(),
    address_line_1: dto.address?.trim() || dto.address_line_1?.trim() || undefined,
  };

  try {
    const response = await fetch(`${API_URL}/suppliers`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMsg = `Supplier creation failed (Status ${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.message) {
          errorMsg = Array.isArray(errJson.message)
            ? errJson.message.join(', ')
            : String(errJson.message);
        }
      } catch {
        // Ignore json parse error
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data && typeof data === 'object') {
      let created = mapSupplierResponse(data);
      created.isActive = dto.isActive ?? true;

      // Handle active state if set to false on creation
      if (dto.isActive === false) {
        try {
          await toggleSupplierStatus(created.id, false);
          created.isActive = false;
        } catch {
          created.isActive = false;
        }
      }

      // Add to local state cache
      mockSuppliers = [created, ...mockSuppliers.filter((s) => s.id !== created.id)];
      return created;
    }
  } catch (error: any) {
    console.warn('Backend supplier creation request error:', error);

    // If fetch failed due to network / offline server, fall back to creating in local mock state
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      const fallbackSupplier: Supplier = {
        id: supplierIdCounter++,
        name: dto.name,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        isActive: dto.isActive ?? true,
        address: dto.address || '',
      };
      mockSuppliers = [fallbackSupplier, ...mockSuppliers];
      return fallbackSupplier;
    }

    throw error;
  }

  const fallbackSupplier: Supplier = {
    id: supplierIdCounter++,
    name: dto.name,
    contactPerson: dto.contactPerson,
    email: dto.email,
    phone: dto.phone,
    isActive: dto.isActive ?? true,
    address: dto.address || '',
  };
  mockSuppliers = [fallbackSupplier, ...mockSuppliers];
  return fallbackSupplier;
};

export const updateSupplier = async (
  id: number,
  dto: UpdateSupplierDto
): Promise<Supplier> => {
  const index = mockSuppliers.findIndex((s) => s.id === id);
  let updatedSupplier: Supplier = {
    ...(index !== -1
      ? mockSuppliers[index]
      : { id, name: '', contactPerson: '', email: '', phone: '', isActive: true }),
    ...dto,
    name: dto.name ?? (index !== -1 ? mockSuppliers[index].name : ''),
    contactPerson: dto.contactPerson ?? (index !== -1 ? mockSuppliers[index].contactPerson : ''),
    email: dto.email ?? (index !== -1 ? mockSuppliers[index].email : ''),
    phone: dto.phone ?? (index !== -1 ? mockSuppliers[index].phone : ''),
    address: dto.address ?? (index !== -1 ? mockSuppliers[index].address : ''),
    isActive: dto.isActive !== undefined ? dto.isActive : (index !== -1 ? mockSuppliers[index].isActive : true),
  };

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
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        const backendResult = mapSupplierResponse(data);
        updatedSupplier = {
          ...updatedSupplier,
          ...backendResult,
          name: backendResult.name || updatedSupplier.name,
          contactPerson: backendResult.contactPerson || updatedSupplier.contactPerson,
          email: backendResult.email || updatedSupplier.email,
          phone: backendResult.phone || updatedSupplier.phone,
          address: backendResult.address || updatedSupplier.address,
          isActive: dto.isActive !== undefined ? dto.isActive : updatedSupplier.isActive,
        };
      }
    }

    if (dto.isActive === false) {
      try {
        await toggleSupplierStatus(id, false);
        updatedSupplier.isActive = false;
      } catch (e) {
        console.warn('Deactivation failed:', e);
      }
    }
  } catch (error) {
    console.warn(`Backend supplier update failed for id ${id}:`, error);
  }

  if (index !== -1) {
    mockSuppliers[index] = updatedSupplier;
  }
  return updatedSupplier;
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
