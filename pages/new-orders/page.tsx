'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Check,
  CalendarDays,
  Loader2,
  X,
  ShoppingBag,
} from 'lucide-react'
import { useUserStore } from '@/store/user-store'
import { usePermission } from '@/lib/use-permission'
import { getOrders, updateOrderStatus } from '@/lib/api/orders'
import { Order } from '@/lib/types/orders'
import { Card } from '@/components/Card'

const formatInputDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export function NewOrders() {
  const router = useRouter()
  const { user } = useUserStore()

  const canView = usePermission('orders')
  const canChange = usePermission('orders', 'change')

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (!canView) {
      router.push('/dashboard')
    }
  }, [user, canView, router])

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('')
  const [appliedFilterDate, setAppliedFilterDate] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setTimeout(() => setToastMessage(null), 3500)
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getOrders()
      // Only show PENDING orders on this page
      setOrders(data.filter((o) => o.status === 'PENDING'))
    } catch (err) {
      console.error('Error fetching orders:', err)
      showToast('Failed to load orders.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (user && canView) {
      Promise.resolve().then(() => fetchOrders())
    }
  }, [user, canView, fetchOrders])

  const handleAction = async (order: Order, action: 'ACCEPTED' | 'REJECTED') => {
    // Optimistically remove from list
    setOrders((prev) => prev.filter((o) => o.id !== order.id))
    setProcessingIds((prev) => new Set(prev).add(order.id))
    try {
      await updateOrderStatus(order.id, { status: action })
      showToast(
        action === 'ACCEPTED'
          ? `Order #${order.id} accepted successfully.`
          : `Order #${order.id} rejected.`,
        'success'
      )
    } catch (err) {
      console.error(`Failed to ${action.toLowerCase()} order:`, err)
      // Re-add the order on failure
      setOrders((prev) => [{ ...order }, ...prev])
      showToast(`Failed to ${action.toLowerCase()} order #${order.id}.`, 'error')
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(order.id)
        return next
      })
    }
  }

  const handleApplyFilters = () => {
    setAppliedSearchQuery(searchQuery)
    setAppliedFilterDate(filterDate)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterDate('')
    setAppliedSearchQuery('')
    setAppliedFilterDate('')
  }

  const filteredOrders = orders.filter((order) => {
    const searchLower = appliedSearchQuery.toLowerCase()
    const matchesSearch =
      String(order.id || '').toLowerCase().includes(searchLower) ||
      String(order.customer || '').toLowerCase().includes(searchLower) ||
      String(order.mealPlan || '').toLowerCase().includes(searchLower)

    let matchesDate = true
    if (appliedFilterDate) {
      const formattedFilterDate = formatInputDate(appliedFilterDate)
      matchesDate = order.deliveryPreferredDate === formattedFilterDate
    }

    return matchesSearch && matchesDate
  })

  if (!user || !canView) return null

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-card shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            toastType === 'success'
              ? 'bg-[#0d7377] text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toastType === 'success' ? <Check size={18} /> : <X size={18} />}
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShoppingBag size={22} className="text-primary" />
          <h2 className="text-2xl font-bold text-ink">New Orders</h2>
        </div>
        <p className="text-ink-soft text-sm mt-1">
          Review and accept or reject incoming customer orders
        </p>
      </div>

      {/* Pending count badge */}
      {!loading && (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full border border-yellow-200">
            <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block animate-pulse" />
            {filteredOrders.length} pending order{filteredOrders.length !== 1 ? 's' : ''} awaiting review
          </span>
        </div>
      )}

      <Card>
        {/* Search & Date Filter */}
        <div className="p-4 border-b border-line bg-card flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row flex-1 gap-4">
            {/* Search */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                placeholder="Search Orders..."
                className="h-10 pl-10 pr-4 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full transition-all text-ink placeholder:text-ink-soft"
              />
            </div>

            {/* Date Filter */}
            <div className="relative shrink-0">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="h-10 pl-3 pr-10 rounded-control border border-line bg-card text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer w-full sm:w-48 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-soft">
                <CalendarDays size={18} />
              </div>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleClearFilters}
              className="h-10 px-4 text-sm font-semibold text-ink-soft bg-canvas hover:bg-canvas/80 border border-line rounded-control transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleApplyFilters}
              className="h-10 px-4 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-control transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-ink-soft">
            <Loader2 className="animate-spin text-primary" size={24} />
            <span className="text-sm font-medium">Loading new orders...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-line text-ink-soft text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 w-[110px]">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Meal Plan</th>
                  <th className="px-6 py-4 w-[110px]">Total</th>
                  <th className="px-6 py-4 w-[200px]">Delivery Preferred Date</th>
                  <th className="px-6 py-4 w-[140px]">Date</th>
                  <th className="px-6 py-4 text-right w-[220px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-card">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const isProcessing = processingIds.has(order.id)
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-canvas/30 transition-colors"
                      >
                        {/* Order ID */}
                        <td className="px-6 py-5 text-ink-soft text-sm font-medium">
                          {order.id}
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-5 font-bold text-ink text-sm">
                          {order.customer}
                        </td>

                        {/* Meal Plan */}
                        <td className="px-6 py-5 text-ink-soft text-sm">
                          {order.mealPlan}
                        </td>

                        {/* Total */}
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-semibold text-ink-soft leading-none">Rs.</span>
                            <span className="text-sm font-bold text-ink mt-0.5">
                              {order.total.toLocaleString()}
                            </span>
                          </div>
                        </td>

                        {/* Delivery Preferred Date */}
                        <td className="px-6 py-5 text-ink-soft text-sm">
                          {order.deliveryPreferredDate}
                        </td>

                        {/* Order Date */}
                        <td className="px-6 py-5 text-ink-soft text-sm">
                          {order.date}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isProcessing ? (
                              <Loader2
                                size={18}
                                className="animate-spin text-ink-soft"
                              />
                            ) : (
                              <>
                                <button
                                  disabled={!canChange}
                                  onClick={() => handleAction(order, 'ACCEPTED')}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0d7377] hover:bg-[#0a5f62] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all duration-150 active:scale-95 shadow-sm"
                                >
                                  <Check size={14} />
                                  Accept
                                </button>
                                <button
                                  disabled={!canChange}
                                  onClick={() => handleAction(order, 'REJECTED')}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all duration-150 active:scale-95 shadow-sm"
                                >
                                  <X size={14} />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-ink-soft">
                        <ShoppingBag size={36} className="opacity-30" />
                        <p className="text-sm font-medium">No pending orders found.</p>
                        <p className="text-xs opacity-70">All orders have been reviewed or no orders match your filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default NewOrders
