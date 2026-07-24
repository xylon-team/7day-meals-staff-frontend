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
    console.error('Failed to fetch admin dashboard stats:', error);
    throw error;
  }
};
