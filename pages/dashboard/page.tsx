'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/user-store'
import { usePermission } from '@/lib/use-permission'
import { getAdminDashboardStats, getInventoryDashboardStats } from '@/lib/api/dashboard'
import { AdminDashboardData, InventoryDashboardData, LowStockAlertItem } from '@/lib/types/dashboard'
import {
  Users,
  UserSquare2,
  ShoppingBag,
  DollarSign,
  Utensils,
  CalendarDays,
  Tags,
  TrendingUp,
  Package,
  AlertTriangle,
  XOctagon,
  ClipboardList,
  RefreshCw,
  XCircle,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  Truck,
} from 'lucide-react'
import { Card, CardContent } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const weeklyData = [
  { name: 'Mon', orders: 120 },
  { name: 'Tue', orders: 132 },
  { name: 'Wed', orders: 101 },
  { name: 'Thu', orders: 143 },
  { name: 'Fri', orders: 190 },
  { name: 'Sat', orders: 230 },
  { name: 'Sun', orders: 210 },
]

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
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink-soft mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-ink">{value}</h3>
          {trend && (
            <p
              className={`text-xs mt-2 flex items-center ${trendUp ? 'text-success-fg' : 'text-danger-fg'
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
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Icon size={24} />
        </div>
      </CardContent>
    </Card>
  )
}

function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminDashboardStats()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 flex justify-center text-ink-soft">Loading dashboard...</div>
  if (!data) return <div className="p-6 flex justify-center text-danger-fg">Failed to load dashboard</div>

  const weeklyDataFormatted = [
    { name: 'Mon', orders: data.weekly_orders.Monday || 0 },
    { name: 'Tue', orders: data.weekly_orders.Tuesday || 0 },
    { name: 'Wed', orders: data.weekly_orders.Wednesday || 0 },
    { name: 'Thu', orders: data.weekly_orders.Thursday || 0 },
    { name: 'Fri', orders: data.weekly_orders.Friday || 0 },
    { name: 'Sat', orders: data.weekly_orders.Saturday || 0 },
    { name: 'Sun', orders: data.weekly_orders.Sunday || 0 },
  ]

  const mealTypeDataFormatted = Object.entries(data.orders_by_categories || {}).map(([key, value]) => ({
    name: key,
    value: value,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Staff"
          value={data.total_staff.toString()}
          icon={Users}
          trend="+2%"
          trendUp={true}
        />
        <StatCard
          title="Total Customers"
          value={data.total_customers.toString()}
          icon={UserSquare2}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Active Orders"
          value={data.active_orders.toString()}
          icon={ShoppingBag}
          trend="+5%"
          trendUp={true}
        />
        <StatCard
          title="Revenue Today"
          value={`Rs. ${data.revenue_today.toLocaleString()}`}
          icon={DollarSign}
          trend="-1%"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Orders This Week</h3>
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

      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b border-line flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Button variant="outline" size="sm">
              View All Logs
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[12px] uppercase text-ink-soft bg-canvas font-semibold">
                <tr>
                  <th className="px-6 py-3 rounded-tl-card">Timestamp</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Module</th>
                  <th className="px-6 py-3 rounded-tr-card">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-6 py-4 text-ink-soft">Today, 10:42 AM</td>
                    <td className="px-6 py-4 font-medium">Kamal Perera</td>
                    <td className="px-6 py-4">Updated Meal Price</td>
                    <td className="px-6 py-4">
                      <Badge variant="info">Meals</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="success">Success</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CateringDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Active Meals" value="86" icon={Utensils} />
        <StatCard title="Meal Plans" value="12" icon={CalendarDays} />
        <StatCard title="Active Promotions" value="3" icon={Tags} />
        <StatCard
          title="Orders This Week"
          value="1,420"
          icon={ShoppingBag}
          trend="+8%"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top 5 Most Ordered Meals</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData.slice(0, 5)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E8E4DE"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F5FAFA' }} />
                  <Bar dataKey="orders" fill="#0D7377" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Order Trends</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E8E4DE"
                  />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#14B8A6"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InventoryDashboard() {
  const router = useRouter()
  const { user } = useUserStore()

  // Granular Permission Checks
  const canViewInventory = usePermission('inventory_item', 'view') || usePermission('inventory_item') || usePermission('inventory')
  const canViewSuppliers = usePermission('supplier', 'view') || usePermission('supplier')
  const canViewSupplyRequests = usePermission('supply_request', 'view') || usePermission('supply_request')
  const canCreateSupplyRequest = usePermission('supply_request', 'add')

  const canViewAny = canViewInventory || canViewSuppliers || canViewSupplyRequests || user?.role === 'Admin' || user?.role === 'Inventory Manager'

  const [data, setData] = useState<InventoryDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const stats = await getInventoryDashboardStats()
      setData(stats)
    } catch (err: any) {
      console.error('Error loading inventory dashboard stats:', err)
      setError(err?.message || 'Failed to load inventory dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  const handleCreateRequest = (itemName: string) => {
    setActionNotice(`Supply request drafted for ${itemName}! Navigating to supply requests...`)
    setTimeout(() => {
      router.push('/supply-requests')
    }, 1200)
  }

  // 1. Permission Denied State
  if (!canViewAny) {
    return (
      <Card className="p-8 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-danger-bg text-danger-fg flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-xl font-bold text-ink mb-2">Access Restricted</h3>
        <p className="text-ink-soft text-sm mb-6">
          You do not have the required permissions to view inventory dashboard metrics. Please contact your administrator to request access.
        </p>
      </Card>
    )
  }

  // 2. Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-line/40 rounded animate-pulse" />
          <div className="h-8 w-24 bg-line/40 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-card border border-line p-6 h-28 animate-pulse flex justify-between items-center">
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
            <div className="h-6 w-40 bg-line/50 rounded" />
            <div className="h-10 w-full bg-line/30 rounded" />
            <div className="h-10 w-full bg-line/30 rounded" />
            <div className="h-10 w-full bg-line/30 rounded" />
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

  // 3. Error State
  if (error) {
    return (
      <Card className="p-8 text-center max-w-xl mx-auto my-12 border-danger-fg/30 bg-danger-bg/10 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-danger-bg text-danger-fg flex items-center justify-center mx-auto mb-4">
          <XCircle size={28} />
        </div>
        <h3 className="text-lg font-bold text-ink mb-2">Failed to Load Dashboard</h3>
        <p className="text-ink-soft text-sm mb-6">{error}</p>
        <Button onClick={fetchDashboardStats} className="inline-flex items-center gap-2">
          <RefreshCw size={16} /> Try Again
        </Button>
      </Card>
    )
  }

  const hasInventoryAccess = canViewInventory || user?.role === 'Admin' || user?.role === 'Inventory Manager'
  const hasRequestAccess = canViewSupplyRequests || user?.role === 'Admin' || user?.role === 'Inventory Manager'

  const recentMovements = data?.recent_inventory_updates || []
  const lowStockAlerts = data?.low_stock_alerts || []

  return (
    <div className="space-y-6">
      {actionNotice && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-card flex items-center gap-3 text-primary text-sm font-medium animate-fadeIn">
          <CheckCircle2 size={18} />
          {actionNotice}
        </div>
      )}

      {/* TOP STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Ingredients */}
        {hasInventoryAccess && (
          <Card className="hover:shadow-card transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-soft mb-1">Total Ingredients</p>
                <h3 className="text-3xl font-bold text-ink">{data?.total_inventory_items ?? 0}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E6F4F1] text-[#0D7377] flex items-center justify-center shrink-0">
                <Package size={22} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Stock Items */}
        {hasInventoryAccess && (
          <div className="bg-[#FFFBEB] rounded-card border border-[#FDE68A] p-6 flex items-center justify-between hover:shadow-card transition-shadow">
            <div>
              <p className="text-sm font-semibold text-[#92400E] mb-1">Low Stock Items</p>
              <h3 className="text-3xl font-bold text-[#B45309]">{data?.low_stock_items ?? 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
          </div>
        )}

        {/* Out of Stock */}
        {hasInventoryAccess && (
          <div className="bg-[#FEF2F2] rounded-card border border-[#FCA5A5] p-6 flex items-center justify-between hover:shadow-card transition-shadow">
            <div>
              <p className="text-sm font-semibold text-[#991B1B] mb-1">Out of Stock</p>
              <h3 className="text-3xl font-bold text-[#DC2626]">{data?.out_of_stock_items ?? 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
              <XCircle size={22} />
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {hasRequestAccess && (
          <Card className="hover:shadow-card transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-soft mb-1">Pending Requests</p>
                <h3 className="text-3xl font-bold text-ink">{data?.pending_supplier_requests ?? 0}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E6F4F1] text-[#0D7377] flex items-center justify-center shrink-0">
                <ClipboardList size={22} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* MAIN CONTENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT STOCK MOVEMENTS TABLE */}
        {hasInventoryAccess ? (
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <div className="p-6 border-b border-line flex justify-between items-center">
                <h3 className="text-lg font-bold text-ink">Recent Stock Movements</h3>
                <button
                  onClick={fetchDashboardStats}
                  className="text-ink-soft hover:text-primary text-xs flex items-center gap-1 transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {recentMovements.length === 0 ? (
                /* Empty State */
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
                          <tr key={movement.stock_adjust_id || idx} className="hover:bg-canvas/60 transition-colors">
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
        ) : (
          <Card className="lg:col-span-2 p-8 text-center text-ink-soft">
            <ShieldAlert size={32} className="mx-auto mb-2 text-warning-fg" />
            <p className="text-sm font-medium">Inventory movements are hidden according to your permission profile.</p>
          </Card>
        )}

        {/* LOW STOCK ALERTS WIDGET */}
        {hasInventoryAccess ? (
          <Card>
            <CardContent className="p-0">
              <div className="p-6 border-b border-line">
                <h3 className="text-lg font-bold text-[#991B1B] flex items-center gap-2">
                  <AlertTriangle size={20} className="text-[#DC2626]" /> Low Stock Alerts
                </h3>
              </div>

              {lowStockAlerts.length === 0 ? (
                /* Empty State */
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
                      {(canCreateSupplyRequest || user?.role === 'Admin' || user?.role === 'Inventory Manager') && (
                        <Button
                          size="sm"
                          className="w-full bg-[#0D7377] hover:bg-[#0A5C5F] text-white font-semibold shadow-sm transition-colors py-2"
                          onClick={() => handleCreateRequest(alertItem.name)}
                        >
                          Create Request
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="p-8 text-center text-ink-soft">
            <ShieldAlert size={32} className="mx-auto mb-2 text-warning-fg" />
            <p className="text-sm font-medium">Low stock alerts are hidden based on permission settings.</p>
          </Card>
        )}
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useUserStore()

  if (!user) return null

  const isInventoryManagerOrHasPerms =
    user.role === 'Inventory Manager' ||
    (user.role !== 'Admin' &&
      user.role !== 'Catering Manager' &&
      (user.permissions?.some((p) => p.startsWith('inventory') || p.startsWith('supplier') || p.startsWith('supply_request')) ?? true))

  return (
    <div>
      {user.role === 'Admin' && <AdminDashboard />}
      {user.role === 'Catering Manager' && <CateringDashboard />}
      {isInventoryManagerOrHasPerms && user.role !== 'Admin' && user.role !== 'Catering Manager' && (
        <InventoryDashboard />
      )}
    </div>
  )
}

export default Dashboard


