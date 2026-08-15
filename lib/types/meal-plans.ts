export interface DayMealSelection {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}

export interface CreateMealPlanDto {
  name: string;
  description: string;
  dietary_preference: string;
  price: number;
  is_available: boolean;
  daily_meals: Record<string, DayMealSelection>;
}

export interface MealPlan {
  id: number;
  name: string;
  description: string;
  dietary_preference: string;
  calculated_price: number;
  is_active: boolean;
  created_at: string;
  daily_meals?: Record<string, DayMealSelection>;
}
