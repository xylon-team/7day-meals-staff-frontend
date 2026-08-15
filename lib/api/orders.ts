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

  return {
    id: String(backendOrder.order_id || backendOrder.id || ''),
    customer: String(customerName),
    mealPlan: String(mealPlanName),
    total: Number(totalAmount),
    deliveryPreferredDate: backendOrder.delivery_preferred_date ? formatDate(backendOrder.delivery_preferred_date) : backendOrder.deliveryPreferredDate || '',
    date: backendOrder.order_timestamp ? formatDate(backendOrder.order_timestamp) : backendOrder.order_date || backendOrder.date || '',
    status: backendOrder.order_status || backendOrder.status || 'PENDING',
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
  const url = new URL(`${API_URL}/order`);
  try {
    const ordersRes = await fetch(url.toString(), { method: 'GET', headers: getAuthHeaders() });

    if (!ordersRes.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const ordersData = await ordersRes.json();
    let customersData: any[] = [];
    let mealsData: any[] = [];
    
    // Fetch customers defensively
    try {
      const customersRes = await fetch(`${API_URL}/customer`, { method: 'GET', headers: getAuthHeaders() });
      if (customersRes.ok) {
        const text = await customersRes.text();
        try { customersData = JSON.parse(text); } catch (e) {}
      }
    } catch (e) {}

    // Fetch meal plans defensively
    try {
      const mealsRes = await fetch(`${API_URL}/meal-plan`, { method: 'GET', headers: getAuthHeaders() });
      if (mealsRes.ok) {
        const text = await mealsRes.text();
        try { mealsData = JSON.parse(text); } catch (e) {}
      }
    } catch (e) {}

    return ordersData.map((order: any) => {
      const customer = customersData.find(c => c.customer_id === order.customer_id);
      if (customer) order.customer = customer;
      
      const meal = mealsData.find(m => m.meal_id === order.meal_id);
      if (meal) order.meal_plan = meal;
      
      return mapOrderResponse(order);
    });
  } catch (error) {
    console.warn('Backend unavailable, returning mock orders data', error);
    return [...mockOrders];
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
    
    // Hydrate result with customer and meal info defensively
    try {
      const customersRes = await fetch(`${API_URL}/customer`, { method: 'GET', headers: getAuthHeaders() });
      if (customersRes.ok) {
        const text = await customersRes.text();
        try {
          const customers = JSON.parse(text);
          const customer = customers.find((c: any) => c.customer_id === result.customer_id);
          if (customer) result.customer = customer;
        } catch (e) {}
      }
    } catch (e) {}

    try {
      const mealsRes = await fetch(`${API_URL}/meal-plan`, { method: 'GET', headers: getAuthHeaders() });
      if (mealsRes.ok) {
        const text = await mealsRes.text();
        try {
          const meals = JSON.parse(text);
          const meal = meals.find((m: any) => m.meal_id === result.meal_id);
          if (meal) result.meal_plan = meal;
        } catch (e) {}
      }
    } catch (e) {}
    
    
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
