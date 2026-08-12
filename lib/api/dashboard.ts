import { AdminDashboardData } from '../types/dashboard';
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


const mockAdminDashboardData: AdminDashboardData = {
  total_staff: 14,
  total_customers: 342,
  active_orders: 28,
  revenue_today: 45800,
  weekly_orders: {
    Monday: 120,
    Tuesday: 135,
    Wednesday: 105,
    Thursday: 160,
    Friday: 210,
    Saturday: 240,
    Sunday: 195,
  },
  orders_by_categories: {
    Breakfast: 450,
    Lunch: 820,
    Dinner: 610,
    Snacks: 230,
  },
  errors: [],
};

export const getAdminDashboardStats = async (): Promise<AdminDashboardData> => {
  const url = new URL(`${API_URL}/stats/admin-dashboard`);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin dashboard stats');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Backend unavailable or failed to fetch admin stats, returning mock stats data:', error);
    return mockAdminDashboardData;
  }
};

