export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PREPARING' | 'DELIVERED';

export interface Order {
  id: string; // e.g. "ORD-1042"
  customer: string;
  mealPlan: string;
  total: number;
  deliveryPreferredDate: string;
  date: string;
  orderTimestamp?: string;
  status: OrderStatus;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}
