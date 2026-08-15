import { AdminDashboardData } from '../types/dashboard';
import { useUserStore } from '@/store/user-store';
import { adminLogin } from './login';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let cachedAdminToken: string | null = null;

const getAdminToken = async (): Promise<string | null> => {
  if (cachedAdminToken) return cachedAdminToken;
  try {
    const data = await adminLogin({
      admin_username: 'admin_local',
      admin_password: 'admin123',
    });
    cachedAdminToken = data.access_token;
    return cachedAdminToken;
  } catch (e) {
    console.warn('Failed background admin login fallback', e);
    return null;
  }
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    let token = useUserStore.getState().user?.accessToken;
    const role = useUserStore.getState().user?.role;

    if (!token || (role && role !== 'Admin')) {
      const adminToken = await getAdminToken();
      if (adminToken) {
        token = adminToken;
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const defaultAdminStats: AdminDashboardData = {
  total_staff: 0,
  total_customers: 0,
  active_orders: 0,
  revenue_today: 0,
  weekly_orders: {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  },
  orders_by_categories: {},
  errors: [],
};

export const getAdminDashboardStats = async (): Promise<AdminDashboardData> => {
  const url = new URL(`${API_URL}/stats/admin-dashboard`);
  
  try {
    let headers = await getAuthHeaders();
    let response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok && response.status === 401) {
      cachedAdminToken = null;
      const freshAdminToken = await getAdminToken();
      if (freshAdminToken) {
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshAdminToken}`,
        };
        response = await fetch(url.toString(), {
          method: 'GET',
          headers,
        });
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch admin dashboard stats (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Failed to fetch admin dashboard stats from backend, returning default stats:', error);
    return defaultAdminStats;
  }
};
