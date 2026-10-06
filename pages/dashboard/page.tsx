'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useUserStore } from '@/store/user-store'
import { getAdminDashboardStats, getInventoryDashboardStats } from '@/lib/api/dashboard'
import { AdminDashboardData, InventoryDashboardData, LowStockAlertItem } from '@/lib/types/dashboard'
import {
  Users,
  UserSquare2,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ClipboardList,
  RefreshCw,
  XCircle,
  Loader2,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#0D7377', '#14B8A6', '#FEF3C7', '#F7F4EF']

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ size: number; className?: string }>
  trend?: string
  trendUp?: boolean
}) {
  return (
    <Card className="hover:shadow-card transition-shadow">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink-soft mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-ink">{value}</h3>
          {trend && (
            <p
              className={`text-xs mt-2 flex items-center ${
                trendUp ? 'text-success-fg' : 'text-danger-fg'
              }`}
            >
              <TrendingUp
                size={12}
                className={`mr-1 ${!trendUp && 'rotate-180'}`}
              />
              {trend} from last week
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Icon size={24} />
        </div>
      </CardContent>
    </Card>
  )
}

function hasPermission(
  user: { role?: string; permissions?: string[] } | null,
  module: string,
  action?: 'add' | 'change' | 'delete' | 'view'
): boolean {
  if (!user) return false
  if (user.role === 'Admin') return true
  if (!user.permissions) return false
  if (action) {
    return user.permissions.includes(`${module}_${action}`)
  }
  return user.permissions.some((p) => p.startsWith(`${module}_`))
}

export function Dashboard() {
  const { user } = useUserStore()

  // ---------------------------------------------------------------------------
  // Data State (all hooks declared unconditionally at the very top)
  // ---------------------------------------------------------------------------
  const [inventoryData, setInventoryData] = useState<InventoryDashboardData | null>(null)
  const [adminStats, setAdminStats] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Pure Permission Evaluations (Safe with || — does NOT call React hooks)
  // ---------------------------------------------------------------------------
  const canViewInventory =
    hasPermission(user, 'inventory_item', 'view') ||
    hasPermission(user, 'inventory_item') ||
    hasPermission(user, 'inventory') ||
    hasPermission(user, 'low_stock_threshold', 'view') ||
    hasPermission(user, 'low_stock_threshold') ||
    hasPermission(user, 'restock', 'view') ||
    hasPermission(user, 'restock') ||
    hasPermission(user, 'restock_history', 'view') ||
    hasPermission(user, 'restock_history')

  const canViewSuppliers =
    hasPermission(user, 'supplier', 'view') || hasPermission(user, 'supplier')

  const canViewSupplyRequests =
    hasPermission(user, 'supply_request', 'view') ||
    hasPermission(user, 'supply_request') ||
    hasPermission(user, 'restock', 'view') ||
    hasPermission(user, 'restock')

  const canViewOrders =
    hasPermission(user, 'orders', 'view') || hasPermission(user, 'orders')
  const canViewReports =
    hasPermission(user, 'analysis_report', 'view') || hasPermission(user, 'analysis_report')
  const canViewCustomers =
    hasPermission(user, 'customer', 'view') || hasPermission(user, 'customer')
  const canViewStaff =
    hasPermission(user, 'staff', 'view') || hasPermission(user, 'staff')
  const canViewLogs =
    hasPermission(user, 'logs', 'view') || hasPermission(user, 'logs')

  const canViewMeals =
    hasPermission(user, 'meal_item', 'view') || hasPermission(user, 'meal_item')
  const canViewMealPlans =
    hasPermission(user, 'meal_package', 'view') || hasPermission(user, 'meal_package')
  const canViewPromotions =
    hasPermission(user, 'promotion', 'view') || hasPermission(user, 'promotion')

  // Check if permissions are currently being fetched in the background after login
  const isLoadingPermissions = user?.role !== 'Admin' && user?.permissions === undefined

  // Check if user has permission to see ANY dashboard item
  const hasAnyPermission =
    canViewInventory ||
    canViewSuppliers ||
    canViewSupplyRequests ||
    canViewOrders ||
    canViewReports ||
    canViewCustomers ||
    canViewStaff ||
    canViewLogs ||
    canViewMeals ||
    canViewMealPlans ||
    canViewPromotions

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const needsInventory = canViewInventory || canViewSuppliers || canViewSupplyRequests
    const needsAdminStats = canViewStaff || canViewCustomers || canViewOrders || canViewReports || canViewLogs

    try {
      const promises: Promise<any>[] = []

      if (needsInventory) {
        promises.push(
          getInventoryDashboardStats()
            .then(setInventoryData)
            .catch((err) => {
              console.warn('Inventory stats unavailable:', err)
              setInventoryData(null)
            })
        )
      }

      if (needsAdminStats) {
        promises.push(
          getAdminDashboardStats().then(setAdminStats)
        )
      }

      await Promise.all(promises)
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err)
      setError('Failed to load dashboard information. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [
    canViewInventory,
    canViewSuppliers,
    canViewSupplyRequests,
    canViewStaff,
    canViewCustomers,
    canViewOrders,
    canViewReports,
    canViewLogs,
  ])

  useEffect(() => {
    if (!user) return

    // If permissions are still being loaded for staff, keep loading
    if (isLoadingPermissions) {
      setLoading(true)
      return
    }

    if (hasAnyPermission) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [user, isLoadingPermissions, hasAnyPermission, fetchDashboardData])

  if (!user) return null

  // ---------------------------------------------------------------------------
  // 1. Loading State (Shown while permissions are loading OR dashboard data is loading)
  // ---------------------------------------------------------------------------
  if (loading || isLoadingPermissions) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 text-ink-soft text-sm font-medium py-1">
          <Loader2 size={18} className="animate-spin text-primary" />
          <span>Loading dashboard metrics…</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card rounded-card border border-line p-6 h-28 animate-pulse flex justify-between items-center"
            >
              <div className="space-y-3">
                <div className="h-4 w-28 bg-line/50 rounded" />
                <div className="h-8 w-16 bg-line/60 rounded" />
              </div>
              <div className="w-12 h-12 rounded-full bg-line/40" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-card border border-line p-6 h-80 animate-pulse space-y-4">
            <div className="h-6 w-44 bg-line/50 rounded" />
            <div className="h-12 w-full bg-line/30 rounded" />
            <div className="h-12 w-full bg-line/30 rounded" />
            <div className="h-12 w-full bg-line/30 rounded" />
          </div>
          <div className="bg-card rounded-card border border-line p-6 h-80 animate-pulse space-y-4">
            <div className="h-6 w-36 bg-line/50 rounded" />
            <div className="h-20 w-full bg-line/30 rounded" />
            <div className="h-20 w-full bg-line/30 rounded" />
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // 2. Error State
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <Card className="p-8 text-center max-w-xl mx-auto my-12 border-danger-fg/30 bg-danger-bg/10 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-danger-bg text-danger-fg flex items-center justify-center mx-auto mb-4">
          <XCircle size={28} />
        </div>
        <h3 className="text-lg font-bold text-ink mb-2">Failed to Load Dashboard</h3>
        <p className="text-ink-soft text-sm mb-6">{error}</p>
        <Button onClick={fetchDashboardData} className="inline-flex items-center gap-2">
          <RefreshCw size={16} /> Try Again
        </Button>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // 3. Permission Denied / Empty Permissions State
  // (Only shown AFTER permissions have finished loading and really no items exist)
  // ---------------------------------------------------------------------------
  if (!hasAnyPermission) {
    return (
      <Card className="p-10 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-warning-bg text-warning-fg flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-xl font-bold text-ink mb-2">No Dashboard Items Available</h3>
        <p className="text-ink-soft text-sm">
          Your account does not have permissions to view any dashboard metrics. Please contact your system administrator to assign the appropriate module access.
        </p>
      </Card>
    )
  }

  // Formatted data for charts
  const weeklyDataFormatted = adminStats
    ? [
        { name: 'Mon', orders: adminStats.weekly_orders?.Monday || 0 },
        { name: 'Tue', orders: adminStats.weekly_orders?.Tuesday || 0 },
        { name: 'Wed', orders: adminStats.weekly_orders?.Wednesday || 0 },
        { name: 'Thu', orders: adminStats.weekly_orders?.Thursday || 0 },
        { name: 'Fri', orders: adminStats.weekly_orders?.Friday || 0 },
        { name: 'Sat', orders: adminStats.weekly_orders?.Saturday || 0 },
        { name: 'Sun', orders: adminStats.weekly_orders?.Sunday || 0 },
      ]
    : []

  const mealTypeDataFormatted = adminStats?.orders_by_categories
    ? Object.entries(adminStats.orders_by_categories).map(([key, value]) => ({
        name: key,
        value: value,
      }))
    : []

  const recentMovements = inventoryData?.recent_inventory_updates || []
  const lowStockAlerts = inventoryData?.low_stock_alerts || []

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. TOP STAT CARDS (Rendered dynamically based on permissions)           */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Staff: Total Staff */}
        {canViewStaff && adminStats && (
          <StatCard
            title="Total Staff"
            value={adminStats.total_staff.toLocaleString()}
            icon={Users}
            trend="+2%"
            trendUp={true}
          />
        )}

        {/* Customers: Total Customers */}
        {canViewCustomers && adminStats && (
          <StatCard
            title="Total Customers"
            value={adminStats.total_customers.toLocaleString()}
            icon={UserSquare2}
            trend="+12%"
            trendUp={true}
          />
        )}

        {/* Orders: Active Orders */}
        {canViewOrders && adminStats && (
          <StatCard
            title="Active Orders"
            value={adminStats.active_orders.toLocaleString()}
            icon={ShoppingBag}
            trend="+5%"
            trendUp={true}
          />
        )}

        {/* Reports: Revenue Today */}
        {canViewReports && adminStats && (
          <StatCard
            title="Revenue Today"
            value={`Rs. ${adminStats.revenue_today.toLocaleString()}`}
            icon={DollarSign}
            trend="-1%"
            trendUp={false}
          />
        )}

        {/* Inventory: Total Ingredients */}
        {canViewInventory && inventoryData && (
          <Card className="hover:shadow-card transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-soft mb-1">Total Ingredients</p>
                <h3 className="text-3xl font-bold text-ink">
                  {inventoryData?.total_inventory_items ?? 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E6F4F1] text-[#0D7377] flex items-center justify-center shrink-0">
                <Package size={22} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory: Low Stock Items (Figma styled yellow card) */}
        {canViewInventory && inventoryData && (
          <div className="bg-[#FFFBEB] rounded-card border border-[#FDE68A] p-6 flex items-center justify-between hover:shadow-card transition-shadow">
            <div>
              <p className="text-sm font-semibold text-[#92400E] mb-1">Low Stock Items</p>
              <h3 className="text-3xl font-bold text-[#B45309]">
                {inventoryData?.low_stock_items ?? 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
          </div>
        )}

        {/* Inventory: Out of Stock (Figma styled pink card) */}
        {canViewInventory && inventoryData && (
          <div className="bg-[#FEF2F2] rounded-card border border-[#FCA5A5] p-6 flex items-center justify-between hover:shadow-card transition-shadow">
            <div>
              <p className="text-sm font-semibold text-[#991B1B] mb-1">Out of Stock</p>
              <h3 className="text-3xl font-bold text-[#DC2626]">
                {inventoryData?.out_of_stock_items ?? 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
              <XCircle size={22} />
            </div>
          </div>
        )}

        {/* Inventory: Pending Supplier Requests */}
        {canViewSupplyRequests && inventoryData && (
          <Card className="hover:shadow-card transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-soft mb-1">Pending Requests</p>
                <h3 className="text-3xl font-bold text-ink">
                  {inventoryData?.pending_supplier_requests ?? 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E6F4F1] text-[#0D7377] flex items-center justify-center shrink-0">
                <ClipboardList size={22} />
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* ===================================================================== */}
      {/* 2. INVENTORY MANAGER SECTION (Recent Movements & Low Stock Alerts)     */}
      {/* ===================================================================== */}
      {canViewInventory && inventoryData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Stock Movements Table (2 Columns) */}
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <div className="p-6 border-b border-line flex justify-between items-center">
                <h3 className="text-lg font-bold text-ink">Recent Stock Movements</h3>
                <button
                  onClick={fetchDashboardData}
                  className="text-ink-soft hover:text-primary text-xs flex items-center gap-1 transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {recentMovements.length === 0 ? (
                <div className="p-12 text-center text-ink-soft">
                  <Package size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium text-sm">No recent stock movements recorded</p>
                  <p className="text-xs text-ink-soft mt-1">
                    Stock adjustments and receipts will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[12px] uppercase text-ink-soft bg-canvas font-semibold border-b border-line">
                      <tr>
                        <th className="px-6 py-3.5">Item</th>
                        <th className="px-6 py-3.5">Type</th>
                        <th className="px-6 py-3.5">Quantity</th>
                        <th className="px-6 py-3.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {recentMovements.map((movement, idx) => {
                        const isAdded =
                          movement.adjustment_type?.toLowerCase() === 'added' ||
                          movement.adjustment_type?.toLowerCase() === 'received' ||
                          movement.quantity > 0

                        const qtyDisplay =
                          movement.quantity > 0
                            ? `+${movement.quantity}kg`
                            : `${movement.quantity}kg`

                        const formattedDate = movement.entered_date
                          ? new Date(movement.entered_date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Today, 08:30 AM'

                        return (
                          <tr
                            key={movement.stock_adjust_id || idx}
                            className="hover:bg-canvas/60 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-ink">
                              {movement.inventory?.ingredient_name || 'Basmati Rice'}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  isAdded
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {isAdded ? 'Added' : 'Used'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-ink">{qtyDisplay}</td>
                            <td className="px-6 py-4 text-ink-soft text-xs whitespace-nowrap">
                              Today, {formattedDate}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts Card (1 Column) */}
          <Card>
            <CardContent className="p-0">
              <div className="p-6 border-b border-line">
                <h3 className="text-lg font-bold text-[#991B1B] flex items-center gap-2">
                  <AlertTriangle size={20} className="text-[#DC2626]" /> Low Stock Alerts
                </h3>
              </div>

              {lowStockAlerts.length === 0 ? (
                <div className="p-8 text-center text-ink-soft">
                  <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                  <p className="font-semibold text-sm text-ink">All Stock Levels Optimal</p>
                  <p className="text-xs text-ink-soft mt-1">No items are currently below reorder levels.</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {lowStockAlerts.map((alertItem: LowStockAlertItem) => (
                    <div
                      key={alertItem.id}
                      className="p-4 rounded-card border border-[#FDE68A] bg-[#FFFBEB] space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-ink text-base">{alertItem.name}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                          {alertItem.currentQuantity}
                        </span>
                      </div>
                      <p className="text-xs text-ink-soft">
                        Reorder level: {alertItem.reorderLevel} • {alertItem.supplier}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. ORDERS & ANALYTICS CHARTS (Rendered if Orders/Reports permitted)    */}
      {/* ===================================================================== */}
      {(canViewOrders || canViewReports) && adminStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Orders This Month</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyDataFormatted}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E8E4DE"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #E8E4DE',
                        boxShadow: '0px 2px 12px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#0D7377"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0D7377' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Orders by Meal Type</h3>
              <div className="h-72 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mealTypeDataFormatted}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {mealTypeDataFormatted.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {mealTypeDataFormatted.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center text-xs text-ink-soft"
                    >
                      <div
                        className="w-3 h-3 rounded-full mr-1.5"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}

export default Dashboard




