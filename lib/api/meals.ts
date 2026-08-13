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
    console.error('Error fetching meals:', error);
    throw error;
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
    console.error('Error creating meal:', error);
    throw error;
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
    console.error(`Error updating meal ${id}:`, error);
    throw error;
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
    console.error(`Error deleting meal ${id}:`, error);
    throw error;
  }
};
