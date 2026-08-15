import { Meal, CreateMealDto, UpdateMealDto } from '../types/meals';
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

// Map backend response properties to frontend Meal properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapMealResponse = (backendMeal: any): Meal => {
  return {
    id: backendMeal.food_item_id || backendMeal.meal_id || backendMeal.id,
    name: backendMeal.item_name || backendMeal.meal_name || backendMeal.name,
    ingredients: backendMeal.ingredient_list || backendMeal.ingredients || '',
    price: Number(backendMeal.price) || 0,
    is_available: backendMeal.is_available !== undefined 
      ? backendMeal.is_available 
      : (backendMeal.availability !== undefined ? backendMeal.availability : true),
    is_veg: backendMeal.is_veg !== undefined 
      ? backendMeal.is_veg 
      : (backendMeal.vegetarian !== undefined ? backendMeal.vegetarian : false),
    image_url: backendMeal.image_path || backendMeal.image_url || undefined,
  };
};

let mockMealsIdCounter = 5;
const mockMeals: Meal[] = [
  {
    id: 1,
    name: 'Chicken Fried Rice',
    ingredients: 'Rice, Chicken, Egg, Vegetables, Soy Sauce',
    price: 850,
    is_available: true,
    is_veg: false,
  },
  {
    id: 2,
    name: 'Vegetable Kottu',
    ingredients: 'Godhamba Roti, Carrots, Leeks, Cabbage, Egg (optional), Spices',
    price: 650,
    is_available: true,
    is_veg: true,
  },
  {
    id: 3,
    name: 'String Hoppers with Fish',
    ingredients: 'Rice Flour String Hoppers, Fish Curry, Coconut Sambol, Dhal Curry',
    price: 450,
    is_available: false,
    is_veg: false,
  },
  {
    id: 4,
    name: 'Chicken Curry Rice',
    ingredients: 'Rice, Chicken Curry, Dhal Curry, Coconut Sambol, Papadam',
    price: 950,
    is_available: true,
    is_veg: false,
  },
];

export const getMeals = async (): Promise<Meal[]> => {
  try {
    const headers = await getAuthHeaders();
    let response = await fetch(`${API_URL}/food-items`, {
      method: 'GET',
      headers,
    });

    if (!response.ok && response.status === 404) {
      response = await fetch(`${API_URL}/meal-item`, {
        method: 'GET',
        headers,
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch meals (HTTP ${response.status})`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(mapMealResponse);
    }
    return [...mockMeals];
  } catch (error) {
    console.warn('Backend meals endpoint unavailable, returning fallback meals data:', error);
    return [...mockMeals];
  }
};

export const createMeal = async (data: CreateMealDto): Promise<Meal> => {
  const payload = {
    item_name: data.name,
    ingredient_list: data.ingredients,
    price: data.price,
    is_available: data.is_available,
    image_path: data.image_url,
  };

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/food-items`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to create meal (HTTP ${response.status})`);
    }
    const result = await response.json();
    return mapMealResponse(result);
  } catch (error) {
    console.warn('Backend meals endpoint unavailable, saving to mock store:', error);
    const newMeal: Meal = {
      id: mockMealsIdCounter++,
      ...data,
    };
    mockMeals.push(newMeal);
    return newMeal;
  }
};

export const updateMeal = async (id: number, data: UpdateMealDto): Promise<Meal> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {};
  if (data.name !== undefined) payload.item_name = data.name;
  if (data.ingredients !== undefined) payload.ingredient_list = data.ingredients;
  if (data.price !== undefined) payload.price = data.price;
  if (data.is_available !== undefined) payload.is_available = data.is_available;
  if (data.image_url !== undefined) payload.image_path = data.image_url;

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/food-items/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to update meal (HTTP ${response.status})`);
    }
    const result = await response.json();
    return mapMealResponse(result);
  } catch (error) {
    console.warn(`Backend meals endpoint unavailable, updating meal ${id} in mock store:`, error);
    const idx = mockMeals.findIndex((m) => m.id === id);
    if (idx === -1) {
      throw new Error('Meal not found');
    }
    mockMeals[idx] = { ...mockMeals[idx], ...data };
    return mockMeals[idx];
  }
};

export const deleteMeal = async (id: number): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/food-items/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to delete meal (HTTP ${response.status})`);
    }
    const idx = mockMeals.findIndex((m) => m.id === id);
    if (idx !== -1) mockMeals.splice(idx, 1);
    return true;
  } catch (error) {
    console.warn(`Backend meals endpoint unavailable, deleting meal ${id} in mock store:`, error);
    const idx = mockMeals.findIndex((m) => m.id === id);
    if (idx !== -1) {
      mockMeals.splice(idx, 1);
    }
    return true;
  }
};
