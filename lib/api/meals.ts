import { Meal, CreateMealDto, UpdateMealDto } from '../types/meals';
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

// Map backend response properties to frontend Meal properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapMealResponse = (backendMeal: any): Meal => {
  return {
    id: backendMeal.food_item_id || backendMeal.id,
    name: backendMeal.item_name || backendMeal.name,
    ingredients: backendMeal.ingredient_list || '',
    price: Number(backendMeal.price) || 0,
    is_available: backendMeal.is_available !== undefined 
      ? backendMeal.is_available 
      : (backendMeal.availability !== undefined ? backendMeal.availability : true),
    is_veg: backendMeal.is_veg !== undefined 
      ? backendMeal.is_veg 
      : (backendMeal.vegetarian !== undefined ? backendMeal.vegetarian : false),
    image_url: backendMeal.image_path || undefined,
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
  const url = new URL(`${API_URL}/food-items`);
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch meals');
    }
    const data = await response.json();
    return data.map(mapMealResponse);
  } catch (error) {
    console.warn('Backend unavailable, returning mock meals data', error);
    return [...mockMeals];
  }
};

export const createMeal = async (data: CreateMealDto): Promise<Meal> => {
  try {
    const payload = {
      item_name: data.name,
      ingredient_list: data.ingredients,
      price: data.price,
      is_available: data.is_available,
      image_path: data.image_url,
    };
    
    const response = await fetch(`${API_URL}/food-items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Failed to create meal');
    }
    const result = await response.json();
    return mapMealResponse(result);
  } catch (error) {
    console.warn('Backend unavailable, creating meal in mock store', error);
    const newMeal: Meal = {
      id: mockMealsIdCounter++,
      ...data,
    };
    mockMeals.push(newMeal);
    return newMeal;
  }
};

export const updateMeal = async (id: number, data: UpdateMealDto): Promise<Meal> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {};
    if (data.name !== undefined) payload.item_name = data.name;
    if (data.ingredients !== undefined) payload.ingredient_list = data.ingredients;
    if (data.price !== undefined) payload.price = data.price;
    if (data.is_available !== undefined) payload.is_available = data.is_available;
    if (data.image_url !== undefined) payload.image_path = data.image_url;

    const response = await fetch(`${API_URL}/food-items/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Failed to update meal');
    }
    const result = await response.json();
    return mapMealResponse(result);
  } catch (error) {
    console.warn(`Backend unavailable, updating meal ${id} in mock store`, error);
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
    const response = await fetch(`${API_URL}/food-items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete meal');
    }
    return true;
  } catch (error) {
    console.warn(`Backend unavailable, deleting meal ${id} in mock store`, error);
    const idx = mockMeals.findIndex((m) => m.id === id);
    if (idx === -1) {
      throw new Error('Meal not found');
    }
    mockMeals.splice(idx, 1);
    return true;
  }
};
