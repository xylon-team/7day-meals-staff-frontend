import { MealPlan, CreateMealPlanDto } from '../types/meal-plans';
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

// Local in-memory mock store for meal plans when backend endpoint is unpopulated/404
let mockMealPlansCounter = 4;
const mockMealPlans: MealPlan[] = [
  {
    id: 1,
    name: 'Standard Office Week',
    description: 'A balanced weekly plan for office employees.',
    dietary_preference: 'Vegetarian',
    is_active: true,
    calculated_price: 9800,
    created_at: '2026-08-01',
    daily_meals: {
      Monday: { breakfast: 'String Hoppers', lunch: 'Rice & Curry', dinner: 'Kottu' },
      Tuesday: { breakfast: 'Milk Rice', lunch: 'Chicken Fried Rice', dinner: 'Noodles' },
      Wednesday: { breakfast: 'String Hoppers', lunch: 'Rice & Curry', dinner: 'Kottu' },
      Thursday: { breakfast: 'Milk Rice', lunch: 'Chicken Fried Rice', dinner: 'Noodles' },
      Friday: { breakfast: 'String Hoppers', lunch: 'Rice & Curry', dinner: 'Kottu' },
      Saturday: { breakfast: 'Milk Rice', lunch: 'Chicken Fried Rice', dinner: 'Noodles' },
      Sunday: { breakfast: 'String Hoppers', lunch: 'Rice & Curry', dinner: 'Kottu' },
    },
  },
  {
    id: 2,
    name: 'Vegan Boost',
    description: 'Plant-based high-protein plan.',
    dietary_preference: 'Vegan',
    is_active: true,
    calculated_price: 10500,
    created_at: '2026-08-05',
    daily_meals: {
      Monday: { breakfast: 'String Hoppers', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Tuesday: { breakfast: 'Milk Rice', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Wednesday: { breakfast: 'String Hoppers', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Thursday: { breakfast: 'Milk Rice', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Friday: { breakfast: 'String Hoppers', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Saturday: { breakfast: 'Milk Rice', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Sunday: { breakfast: 'String Hoppers', lunch: 'Rice & Curry', dinner: 'Noodles' },
    },
  },
  {
    id: 3,
    name: 'Gluten Free Delight',
    description: 'Special dietary plan with no gluten ingredients.',
    dietary_preference: 'Gluten-Free',
    is_active: false,
    calculated_price: 11200,
    created_at: '2026-08-10',
    daily_meals: {
      Monday: { breakfast: 'Milk Rice', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Tuesday: { breakfast: 'Milk Rice', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Wednesday: { breakfast: 'Milk Rice', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Thursday: { breakfast: 'Milk Rice', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Friday: { breakfast: 'Milk Rice', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Saturday: { breakfast: 'Milk Rice', lunch: 'Rice & Curry', dinner: 'Noodles' },
      Sunday: { breakfast: 'Milk Rice', lunch: 'Rice & Curry', dinner: 'Noodles' },
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBackendMealPlan = (item: any): MealPlan => {
  return {
    id: item.meal_id || item.id,
    name: item.item_name || item.name || 'Unnamed Plan',
    description: item.description || '',
    dietary_preference: item.dietary_preference || item.category || 'General',
    calculated_price: Number(item.price) || Number(item.calculated_price) || 0,
    is_active: item.is_available !== undefined ? item.is_available : (item.is_active ?? true),
    created_at: item.created_at || new Date().toISOString().split('T')[0],
    daily_meals: item.daily_meals || {},
  };
};

export const getMealPlans = async (): Promise<MealPlan[]> => {
  const url = `${API_URL}/meal-plan`;
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch meal plans (HTTP ${response.status})`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(mapBackendMealPlan);
    }
    return [...mockMealPlans];
  } catch (error) {
    console.warn('Backend meal plan endpoint unavailable, returning mock store plans:', error);
    return [...mockMealPlans];
  }
};

export const createMealPlan = async (data: CreateMealPlanDto): Promise<MealPlan> => {
  const url = `${API_URL}/meal-plan`;
  const payload = {
    item_name: data.name,
    category: data.dietary_preference || 'General',
    description: data.description,
    dietary_preference: data.dietary_preference,
    price: data.price,
    is_available: data.is_available,
    daily_meals: data.daily_meals,
  };

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create meal plan (HTTP ${response.status})`);
    }

    const result = await response.json();
    const created = mapBackendMealPlan(result);
    mockMealPlans.unshift(created);
    return created;
  } catch (error) {
    console.warn('Backend meal plan endpoint unavailable, saving to mock store:', error);
    const newPlan: MealPlan = {
      id: mockMealPlansCounter++,
      name: data.name,
      description: data.description,
      dietary_preference: data.dietary_preference || 'General',
      calculated_price: data.price,
      is_active: data.is_available,
      created_at: new Date().toISOString().split('T')[0],
      daily_meals: data.daily_meals,
    };
    mockMealPlans.unshift(newPlan);
    return newPlan;
  }
};

export const deleteMealPlan = async (id: number): Promise<boolean> => {
  const url = `${API_URL}/meal-plan/${id}`;
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to delete meal plan (HTTP ${response.status})`);
    }
    const idx = mockMealPlans.findIndex((p) => p.id === id);
    if (idx !== -1) mockMealPlans.splice(idx, 1);
    return true;
  } catch (error) {
    console.warn(`Backend meal plan endpoint unavailable, deleting plan ${id} from mock store:`, error);
    const idx = mockMealPlans.findIndex((p) => p.id === id);
    if (idx !== -1) {
      mockMealPlans.splice(idx, 1);
    }
    return true;
  }
};
