export interface Meal {
  id: number;
  name: string;
  ingredients: string;
  price: number;
  is_available: boolean;
  is_veg?: boolean;
  image_url?: string;
}

export interface CreateMealDto {
  name: string;
  ingredients: string;
  price: number;
  is_available: boolean;
  is_veg?: boolean;
  image_url?: string;
}

export interface UpdateMealDto {
  name?: string;
  ingredients?: string;
  price?: number;
  is_available?: boolean;
  is_veg?: boolean;
  image_url?: string;
}
