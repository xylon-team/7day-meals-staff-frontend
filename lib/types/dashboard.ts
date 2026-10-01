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

export interface RecentInventoryUpdate {
  stock_adjust_id: number;
  adjustment_type: string;
  quantity: number;
  entered_date: string;
  remarks: string | null;
  inventory: { inventory_id: number; ingredient_name: string };
  staff: { fname: string; lname: string };
}

export interface LowStockAlertItem {
  id: number;
  name: string;
  currentQuantity: string;
  reorderLevel: string;
  supplier: string;
}

export interface InventoryDashboardData {
  total_inventory_items: number;
  total_suppliers: number;
  low_stock_items: number;
  out_of_stock_items: number;
  pending_supplier_requests: number;
  recent_inventory_updates: RecentInventoryUpdate[];
  low_stock_alerts?: LowStockAlertItem[];
}

