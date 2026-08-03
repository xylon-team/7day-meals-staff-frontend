import { Order, UpdateOrderStatusDto } from '../types/orders';
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

// Map backend response properties to frontend Order properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapOrderResponse = (backendOrder: any): Order => {
  return {
    id: backendOrder.order_id || backendOrder.id || '',
    customer: backendOrder.customer_name || backendOrder.customer || '',
    mealPlan: backendOrder.meal_plan || backendOrder.mealPlan || '',
    total: Number(backendOrder.total) || 0,
    deliveryPreferredDate: backendOrder.delivery_preferred_date || backendOrder.deliveryPreferredDate || '',
    date: backendOrder.order_date || backendOrder.date || '',
    status: backendOrder.status || 'PENDING',
  };
};

const mockOrders: Order[] = [
  {
    id: 'ORD-1042',
    customer: 'Saman Kumara',
    mealPlan: 'Executive Lunch Pack',
    total: 5500,
    deliveryPreferredDate: 'Oct 24, 2023',
    date: 'Today',
    status: 'PENDING',
  },
  {
    id: 'ORD-1041',
    customer: 'Nishanthi Silva',
    mealPlan: 'Full Week Complete',
    total: 21000,
    deliveryPreferredDate: 'Oct 25, 2023',
    date: 'Yesterday',
    status: 'PENDING',
  },
  {
    id: 'ORD-1040',
    customer: 'Arjun Perera',
    mealPlan: 'Healthy Breakfast Bowl',
    total: 3200,
    deliveryPreferredDate: 'Oct 24, 2023',
    date: 'Yesterday',
    status: 'PENDING',
  },
  {
    id: 'ORD-1039',
    customer: 'Lakmini Fernando',
    mealPlan: 'Standard Office Pack',
    total: 12450,
    deliveryPreferredDate: 'Oct 26, 2023',
    date: 'Oct 22, 2023',
    status: 'PENDING',
  },
];

export const getOrders = async (): Promise<Order[]> => {
  const url = new URL(`${API_URL}/orders`);
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    const data = await response.json();
    return data.map(mapOrderResponse);
  } catch (error) {
    console.warn('Backend unavailable, returning mock orders data', error);
    return [...mockOrders];
  }
};

export const updateOrderStatus = async (id: string, dto: UpdateOrderStatusDto): Promise<Order> => {
  try {
    const response = await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    const result = await response.json();
    return mapOrderResponse(result);
  } catch (error) {
    console.warn(`Backend unavailable, updating order ${id} status in mock store`, error);
    const idx = mockOrders.findIndex((o) => o.id === id);
    if (idx === -1) {
      throw new Error('Order not found');
    }
    mockOrders[idx] = { ...mockOrders[idx], status: dto.status };
    return mockOrders[idx];
  }
};
