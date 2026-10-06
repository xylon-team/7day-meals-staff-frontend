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

const formatDate = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const mapOrderResponse = (backendOrder: any): Order => {
  const customerName = backendOrder.customer?.fname ? `${backendOrder.customer.fname} ${backendOrder.customer.lname}` : backendOrder.customer_name || backendOrder.customer || (backendOrder.customer_id ? `Customer #${backendOrder.customer_id}` : '');
  const mealPlanName = backendOrder.meal_plan?.item_name || backendOrder.meal_plan || backendOrder.mealPlan || (backendOrder.meal_id ? `Meal Plan #${backendOrder.meal_id}` : '');
  const totalAmount = backendOrder.meal_plan?.price || backendOrder.total || 0;

  const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'PREPARING', 'DELIVERED'];
  const rawStatus = backendOrder.order_status || backendOrder.status || 'PENDING';
  const normalizedStatus = String(rawStatus).toUpperCase();
  const status = validStatuses.includes(normalizedStatus) ? normalizedStatus : 'PENDING';

  return {
    id: String(backendOrder.order_id || backendOrder.id || ''),
    customer: String(customerName),
    mealPlan: String(mealPlanName),
    total: Number(totalAmount),
    deliveryPreferredDate: backendOrder.delivery_preferred_date ? formatDate(backendOrder.delivery_preferred_date) : backendOrder.deliveryPreferredDate || '',
    date: backendOrder.order_timestamp ? formatDate(backendOrder.order_timestamp) : backendOrder.order_date || backendOrder.date || '',
    orderTimestamp: backendOrder.order_timestamp || backendOrder.order_date || backendOrder.date || '',
    status: status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PREPARING' | 'DELIVERED',
  };
};

export const getOrders = async (): Promise<Order[]> => {
  const url = new URL(`${API_URL}/order`);
  try {
    const ordersRes = await fetch(url.toString(), { method: 'GET', headers: getAuthHeaders() });

    if (!ordersRes.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const ordersData = await ordersRes.json();
    return ordersData.map(mapOrderResponse);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (id: string, dto: UpdateOrderStatusDto): Promise<Order> => {
  try {
    const response = await fetch(`${API_URL}/order/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ order_status: dto.status }),
    });
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    const result = await response.json();
    return mapOrderResponse(result);
  } catch (error) {
    console.error(`Failed to update order ${id} status:`, error);
    throw error;
  }
};
