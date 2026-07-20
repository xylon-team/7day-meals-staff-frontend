'use client'

import React, { useState, useEffect } from 'react'
import { useUserStore } from '@/store/user-store'
import { getAdminDashboardStats } from '@/lib/api/dashboard'
import { AdminDashboardData } from '@/lib/types/dashboard'
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

const mealTypeData = [
  { name: 'Breakfast', value: 400 },
  { name: 'Lunch', value: 800 },
  { name: 'Dinner', value: 600 },
  { name: 'Snack', value: 200 },
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Ingredients" value="245" icon={Package} />

        <div className="bg-warning-bg/30 rounded-card border border-warning-fg/20 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-warning-fg mb-1">
              Low Stock Items
            </p>
            <h3 className="text-2xl font-bold text-warning-fg">18</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-warning-bg flex items-center justify-center text-warning-fg">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-danger-bg/30 rounded-card border border-danger-fg/20 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-danger-fg mb-1">
              Out of Stock
            </p>
            <h3 className="text-2xl font-bold text-danger-fg">3</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-danger-bg flex items-center justify-center text-danger-fg">
            <XOctagon size={24} />
          </div>
        </div>

        <StatCard title="Pending Requests" value="8" icon={ClipboardList} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="p-6 border-b border-line">
              <h3 className="text-lg font-semibold">Recent Stock Movements</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[12px] uppercase text-ink-soft bg-canvas font-semibold">
                  <tr>
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="hover:bg-canvas/50">
                      <td className="px-6 py-4 font-medium">Basmati Rice</td>
                      <td className="px-6 py-4">
                        <Badge variant={i % 2 === 0 ? 'success' : 'info'}>
                          {i % 2 === 0 ? 'Added' : 'Used'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {i % 2 === 0 ? '+50kg' : '-20kg'}
                      </td>
                      <td className="px-6 py-4 text-ink-soft">Today, 08:30 AM</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="p-6 border-b border-line">
              <h3 className="text-lg font-semibold text-danger-fg flex items-center gap-2">
                <AlertTriangle size={20} /> Low Stock Alerts
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {[
                {
                  name: 'Red Onions',
                  current: '5kg',
                  reorder: '10kg',
                  supplier: 'Perera Distributors',
                },
                {
                  name: 'Chicken Breast',
                  current: '12kg',
                  reorder: '20kg',
                  supplier: 'Fresh Meats Co.',
                },
                {
                  name: 'Coconut Milk',
                  current: '8L',
                  reorder: '15L',
                  supplier: 'Lanka Grocers',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-card border border-warning-fg/30 bg-warning-bg/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{item.name}</h4>
                    <Badge variant="warning">{item.current} left</Badge>
                  </div>
                  <p className="text-xs text-ink-soft mb-3">
                    Reorder level: {item.reorder} • {item.supplier}
                  </p>
                  <Button size="sm" className="w-full">
                    Create Request
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useUserStore()

  if (!user) return null

  return (
    <div>
      {user.role === 'Admin' && <AdminDashboard />}
      {user.role === 'Catering Manager' && <CateringDashboard />}
      {user.role === 'Inventory Manager' && <InventoryDashboard />}
    </div>
  )
}

export default Dashboard

