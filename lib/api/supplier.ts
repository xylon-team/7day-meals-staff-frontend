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

/**
 * Fetch suppliers from the backend API: GET /suppliers (supports ?search= query)
 */
export const getSuppliers = async (search?: string): Promise<Supplier[]> => {
  const url = new URL(`${API_URL}/suppliers`);
  if (search && search.trim()) {
    url.searchParams.set('search', search.trim());
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) throw new Error(`Failed to fetch suppliers: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid supplier list response');
  return data.map(mapSupplierResponse);
};

/**
 * Toggle supplier status. If deactivating, calls PATCH /suppliers/:id/deactivate
 */
export const toggleSupplierStatus = async (
  id: number,
  isActive: boolean,
  currentSupplier?: Supplier,
): Promise<Supplier> => {
  const headers = await getAuthHeaders();
  const response = await fetch(
    isActive ? `${API_URL}/suppliers/${id}` : `${API_URL}/suppliers/${id}/deactivate`,
    {
      method: 'PATCH',
      headers,
      ...(isActive ? { body: JSON.stringify({ is_active: true }) } : {}),
    },
  );

  if (!response.ok) throw new Error(`Failed to update supplier status: ${response.status}`);

  let responseData: Record<string, unknown> = {};
  try {
    responseData = await response.json();
  } catch {
    // Some status endpoints return no response body.
  }

  const mapped = mapSupplierResponse({ supplier_id: id, is_active: isActive, ...responseData });
  return {
    ...currentSupplier,
    ...mapped,
    id,
    name: mapped.name || currentSupplier?.name || '',
    contactPerson: mapped.contactPerson || currentSupplier?.contactPerson || '',
    email: mapped.email || currentSupplier?.email || '',
    phone: mapped.phone || currentSupplier?.phone || '',
    categories: mapped.categories?.length ? mapped.categories : currentSupplier?.categories || [],
    address: mapped.address || currentSupplier?.address || '',
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
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid supplier creation response');
  }
  const created = mapSupplierResponse(data);
  created.isActive = dto.isActive ?? created.isActive;

  if (dto.isActive === false) {
    return toggleSupplierStatus(created.id, false, created);
  }
  return created;
};

export const updateSupplier = async (
  id: number,
  dto: UpdateSupplierDto
): Promise<Supplier> => {
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

  if (!response.ok) throw new Error(`Failed to update supplier ${id}: ${response.status}`);
  const data = await response.json();
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid supplier update response');
  }

  let updatedSupplier: Supplier = { ...mapSupplierResponse(data), ...dto, id };
  if (dto.isActive === false) {
    updatedSupplier = await toggleSupplierStatus(id, false, updatedSupplier);
  }
  return updatedSupplier;
};

export const deleteSupplier = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}/suppliers/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to delete supplier ${id}: ${response.status}`);
  return true;
};
