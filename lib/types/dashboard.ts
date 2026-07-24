export interface AdminDashboardData {
  total_staff: number;
  total_customers: number;
  active_orders: number;
  revenue_today: number;
  weekly_orders: {
    Sunday: number;
    Monday: number;
    Tuesday: number;
    Wednesday: number;
    Thursday: number;
    Friday: number;
    Saturday: number;
  };
  orders_by_categories: Record<string, number>;
  errors: string[];
}
