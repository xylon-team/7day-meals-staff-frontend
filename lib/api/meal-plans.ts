import { MealPlan, CreateMealPlanDto, UpdateMealPlanDto } from '../types/meal-plans';
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

// Map backend response properties to frontend MealPlan properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapMealPlanResponse = (backendPlan: any): MealPlan => {
  return {
    id: backendPlan.meal_id || backendPlan.id,
    name: backendPlan.item_name || backendPlan.name,
    category: backendPlan.category || '',
    description: backendPlan.description || '',
    dietary_preference: backendPlan.dietary_preference || '',
    price: Number(backendPlan.price) || 0,
    is_available: backendPlan.is_available !== undefined 
      ? backendPlan.is_available 
      : true,
    image_url: backendPlan.image_path || backendPlan.image_url || undefined,
    food_items: backendPlan.food_items?.map((fi: any) => ({
      meal_id: fi.meal_id,
      food_item_id: fi.food_item_id,
      day: fi.day,
      meal_type: fi.meal_type,
      food_item: fi.food_item ? {
        id: fi.food_item.food_item_id,
        name: fi.food_item.item_name,
        ingredients: fi.food_item.ingredient_list,
        price: Number(fi.food_item.price),
        is_available: fi.food_item.is_available,
        image_url: fi.food_item.image_path,
      } : undefined
    }))
  };
};

export const getMealPlans = async (): Promise<MealPlan[]> => {
  const url = new URL(`${API_URL}/meal-plan`);
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch meal plans');
    }
    const data = await response.json();
    return data.map(mapMealPlanResponse);
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    throw error;
  }
};

export const createMealPlan = async (data: CreateMealPlanDto): Promise<MealPlan> => {
  try {
    const payload = {
      mealPlan: {
        item_name: data.name,
        category: data.category,
        description: data.description,
        dietary_preference: data.dietary_preference,
        price: data.price,
        is_available: data.is_available,
        image_path: data.image_url,
      },
      foodItems: data.food_items?.map(fi => ({
        meal_id: 0,
        food_item_id: fi.food_item_id,
        day: fi.day,
        meal_type: fi.meal_type,
      })) || []
    };
    
    const response = await fetch(`${API_URL}/meal-plan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Failed to create meal plan');
    }
    const result = await response.json();
    return mapMealPlanResponse(result);
  } catch (error) {
    console.error('Error creating meal plan:', error);
    throw error;
  }
};

export const updateMealPlan = async (id: number, data: UpdateMealPlanDto): Promise<MealPlan> => {
  try {
    const payload = {
      mealPlan: {
        item_name: data.name,
        category: data.category,
        description: data.description,
        dietary_preference: data.dietary_preference,
        price: data.price,
        is_available: data.is_available,
        image_path: data.image_url,
      },
      foodItems: data.food_items?.map(fi => ({
        meal_id: id,
        food_item_id: fi.food_item_id,
        day: fi.day,
        meal_type: fi.meal_type,
      })) // If undefined, the backend won't update foodItems
    };

    const response = await fetch(`${API_URL}/meal-plan/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Failed to update meal plan');
    }
    const result = await response.json();
    return mapMealPlanResponse(result);
  } catch (error) {
    console.error(`Error updating meal plan ${id}:`, error);
    throw error;
  }
};

export const deleteMealPlan = async (id: number): Promise<boolean> => {
  try {
    // Note: ensure the backend supports DELETE /meal-plan/:id
    const response = await fetch(`${API_URL}/meal-plan/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete meal plan');
    }
    return true;
  } catch (error) {
    console.error(`Error deleting meal plan ${id}:`, error);
    throw error;
  }
};
