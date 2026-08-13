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

/** Clears the user session and redirects to /login on 401. */
const handleUnauthorized = () => {
  useUserStore.getState().logout();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const getAdminDashboardStats = async (): Promise<AdminDashboardData> => {
  const url = new URL(`${API_URL}/stats/admin-dashboard`);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch admin dashboard stats (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch admin dashboard stats:', error);
    throw error;
  }
};
