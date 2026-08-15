import { Meal } from './meals';

export interface MealPlanFoodItem {
  meal_id?: number;
  food_item_id: number;
  day: string;
  meal_type: string;
  food_item?: Meal;
}

export interface MealPlan {
  id: number;
  name: string;
  category?: string;
  description: string;
  dietary_preference: string;
  price: number;
  calculated_price?: number;
  is_available: boolean;
  is_active?: boolean;
  created_at?: string;
  image_url?: string;
  food_items?: MealPlanFoodItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  daily_meals?: Record<string, any>;
}

export interface CreateMealPlanDto {
  name: string;
  category?: string;
  description: string;
  dietary_preference: string;
  price: number;
  is_available?: boolean;
  image_url?: string;
  food_items?: Omit<MealPlanFoodItem, 'meal_id' | 'food_item'>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  daily_meals?: Record<string, any>;
}

export interface UpdateMealPlanDto {
  name?: string;
  category?: string;
  description?: string;
  dietary_preference?: string;
  price?: number;
  is_available?: boolean;
  image_url?: string;
  food_items?: Omit<MealPlanFoodItem, 'meal_id' | 'food_item'>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  daily_meals?: Record<string, any>;
}
