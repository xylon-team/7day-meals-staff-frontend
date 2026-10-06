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
  UtensilsCrossed,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { useUserStore } from '@/store/user-store'
import { usePermission } from '@/lib/use-permission'
import { getOrders, updateOrderStatus } from '@/lib/api/orders'
import { getMealPlans } from '@/lib/api/meal-plans'
import { Order } from '@/lib/types/orders'
import { MealPlan, MealPlanFoodItem } from '@/lib/types/meal-plans'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

const formatInputDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'] as const

const MEAL_TYPE_BADGE: Record<string, string> = {
  Breakfast: 'bg-amber-100 text-amber-700',
  Lunch: 'bg-emerald-100 text-emerald-700',
  Dinner: 'bg-indigo-100 text-indigo-700',
}

const getPlanWeekRange = (plan: MealPlan) => {
  if (!plan.food_items || plan.food_items.length === 0) return 'Not set'
  const planDays = Array.from(new Set(plan.food_items.map(fi => fi.day)))
  if (planDays.length === 0) return 'Not set'
  const sortedDays = planDays.sort(
    (a, b) => DAYS.indexOf(a as typeof DAYS[number]) - DAYS.indexOf(b as typeof DAYS[number]),
  )
  if (sortedDays.length === 5 && !sortedDays.includes('Saturday') && !sortedDays.includes('Sunday'))
    return 'Mon–Fri'
  if (sortedDays.length === 7) return 'Mon–Sun'
  if (sortedDays.length === 2 && sortedDays.includes('Saturday') && sortedDays.includes('Sunday'))
    return 'Sat–Sun'
  return `${sortedDays.length} Day${sortedDays.length > 1 ? 's' : ''}`
}

function FoodItemsGrid({ plan }: { plan: MealPlan }) {
  const items = plan.food_items ?? []

  // day → mealType → item
  const schedule: Record<string, Record<string, MealPlanFoodItem>> = {}
  items.forEach(fi => {
    if (!schedule[fi.day]) schedule[fi.day] = {}
    schedule[fi.day][fi.meal_type] = fi
  })

  const activeDays = DAYS.filter(d => schedule[d])

  if (activeDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-ink-soft bg-card border border-line rounded-xl gap-2 shadow-sm">
        <UtensilsCrossed size={32} className="opacity-30" />
        <p className="text-sm font-medium">No food items assigned to this plan.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {activeDays.map(day => (
        <div key={day} className="rounded-xl border border-line bg-card overflow-hidden shadow-sm flex flex-col">
          {/* Day header */}
          <div className="bg-gradient-to-r from-[#0d7377]/10 to-transparent px-4 py-2.5 border-b border-line">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0d7377]">{day}</span>
          </div>

          {/* Meal slots */}
          <div className="divide-y divide-line/60 flex-1 flex flex-col justify-stretch">
            {MEAL_TYPES.map(mealType => {
              const slot = schedule[day]?.[mealType]
              if (!slot) return null
              const fi = slot.food_item

              return (
                <div key={mealType} className="p-3.5 flex gap-3.5 items-start flex-1 hover:bg-canvas/10 transition-colors">
                  {/* Food image */}
                  {fi?.image_url ? (
                    <img
                      src={fi.image_url}
                      alt={fi.name}
                      className="w-14 h-14 rounded-lg object-cover shrink-0 border border-line shadow-sm hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-line/40 flex items-center justify-center shrink-0 border border-line/80">
                      <UtensilsCrossed size={20} className="text-ink-soft/40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span
                      className={`inline-block text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full mb-1.5 shadow-sm ${MEAL_TYPE_BADGE[mealType]}`}
                    >
                      {mealType}
                    </span>
                    <p className="text-sm font-bold text-ink leading-snug truncate" title={fi?.name}>
                      {fi?.name ?? `Food item #${slot.food_item_id}`}
                    </p>
                    {fi?.ingredients && (
                      <p className="text-[11px] text-ink-soft/80 truncate mt-0.5" title={fi.ingredients}>
                        {fi.ingredients}
                      </p>
                    )}
                    {fi?.price !== undefined && (
                      <p className="text-xs font-semibold text-[#0d7377] mt-1">Rs. {fi.price.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const getFallbackMealPlan = (name: string): MealPlan => {
  const normalized = name.toLowerCase();

  // Helper to generate a basic food item
  const createMockFoodItem = (id: number, itemName: string, price: number, imageNum: number, ingredients = ''): any => ({
    id,
    name: itemName,
    price,
    ingredients: ingredients || `${itemName} ingredients list`,
    is_available: true,
    image_url: `https://picsum.photos/id/${imageNum}/150/150`
  });

  if (normalized.includes('executive') || normalized.includes('lunch')) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const mealsMap: Record<string, string> = {
      Monday: 'Grilled Chicken & Quinoa',
      Tuesday: 'Teriyaki Salmon Bowl',
      Wednesday: 'Garlic Butter Beef Rice',
      Thursday: 'Herb Roasted Pork Chop',
      Friday: 'Creamy Prawn Pasta'
    };
    const foodItems: MealPlanFoodItem[] = days.map((day, idx) => ({
      food_item_id: idx + 101,
      day,
      meal_type: 'Lunch',
      food_item: createMockFoodItem(
        idx + 101,
        mealsMap[day],
        1200 + (idx * 50),
        100 + idx,
        `Premium protein, fresh herbs, organic vegetables, and specialized house sauce.`
      )
    }));

    return {
      id: 901,
      name: name || 'Executive Lunch Pack',
      category: 'Executive',
      description: 'A premium, high-protein lunch menu designed for professionals who value nutrition and taste.',
      dietary_preference: 'Non-Vegetarian',
      price: foodItems.reduce((sum, item) => sum + (item.food_item?.price || 0), 0),
      is_available: true,
      food_items: foodItems
    };
  }

  if (normalized.includes('full') || normalized.includes('complete')) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    const breakfast = ['Classic Oatmeal & Berries', 'Avocado Sourdough Toast', 'Egg & Spinach Wrap', 'Vanilla Protein Pancake', 'Greek Yogurt Parfait', 'Fluffy Cheese Omelette', 'Quinoa Breakfast Bowl'];
    const lunch = ['Spiced Tofu Buddha Bowl', 'Mediterranean Salmon Salad', 'Smoked Turkey Sandwich', 'Garlic Shrimp Stir Fry', 'Beef & Broccoli Quinoa', 'Lemon Herb Chicken Salad', 'Vegetable Minestrone Soup'];
    const dinner = ['Seared Tuna Steak', 'Baked Lemon Garlic Salmon', 'Beef Tenderloin & Asparagus', 'Rosemary Roasted Chicken', 'Slow Cooked Lamb Stew', 'Pesto Chicken Penne', 'Vegetarian Lasagna'];

    const foodItems: MealPlanFoodItem[] = [];
    days.forEach((day, dIdx) => {
      foodItems.push({
        food_item_id: dIdx + 201,
        day,
        meal_type: 'Breakfast',
        food_item: createMockFoodItem(dIdx + 201, breakfast[dIdx], 650, 200 + dIdx, 'Organic oats, seasonal berries, honey, and nuts.')
      });
      foodItems.push({
        food_item_id: dIdx + 301,
        day,
        meal_type: 'Lunch',
        food_item: createMockFoodItem(dIdx + 301, lunch[dIdx], 1100, 300 + dIdx, 'High fiber grains, clean protein, and locally sourced greens.')
      });
      foodItems.push({
        food_item_id: dIdx + 401,
        day,
        meal_type: 'Dinner',
        food_item: createMockFoodItem(dIdx + 401, dinner[dIdx], 1400, 400 + dIdx, 'Chef\'s signature dinner selection with balance of healthy fats and protein.')
      });
    });

    return {
      id: 902,
      name: name || 'Full Week Complete',
      category: 'Complete',
      description: 'The ultimate nutrition subscription. Covers all 3 main meals for the entire week to keep you fueled.',
      dietary_preference: 'Balanced Diet',
      price: foodItems.reduce((sum, item) => sum + (item.food_item?.price || 0), 0),
      is_available: true,
      food_items: foodItems
    };
  }

  if (normalized.includes('breakfast') || normalized.includes('bowl')) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const breakfasts = [
      'Acai Protein Smoothie Bowl',
      'Avocado Cream Egg Sourdough',
      'Maple Pecan Oatmeal Pot',
      'Smoked Salmon Egg Scramble',
      'Mixed Berry Granola Parfait',
      'Spinach & Mushroom Frittata',
      'Chia Seed Coconut Pudding'
    ];

    const foodItems: MealPlanFoodItem[] = days.map((day, idx) => ({
      food_item_id: idx + 501,
      day,
      meal_type: 'Breakfast',
      food_item: createMockFoodItem(idx + 501, breakfasts[idx], 750, 500 + idx, 'Freshly prepared nutritious breakfast loaded with superfoods and micro-nutrients.')
    }));

    return {
      id: 903,
      name: name || 'Healthy Breakfast Bowl',
      category: 'Breakfast Only',
      description: 'Kickstart your day with our premium breakfast bowls packed with antioxidants, vitamins, and energy.',
      dietary_preference: 'Vegetarian Option Available',
      price: foodItems.reduce((sum, item) => sum + (item.food_item?.price || 0), 0),
      is_available: true,
      food_items: foodItems
    };
  }

  // Fallback for Standard Office Pack/Week or any other plan (Mon-Fri, Breakfast + Lunch)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const breakfasts = ['Granola Pot', 'Boiled Eggs & Toast', 'Banana Nut Muffin', 'Egg Drop Sandwich', 'Fruit Salad & Yogurt'];
  const lunches = ['Chicken Fried Rice', 'Spicy Fish Curry', 'Mixed Vegetable Pasta', 'Tuna Salad Wrap', 'Beef Teriyaki Rice'];

  const foodItems: MealPlanFoodItem[] = [];
  days.forEach((day, idx) => {
    foodItems.push({
      food_item_id: idx + 601,
      day,
      meal_type: 'Breakfast',
      food_item: createMockFoodItem(idx + 601, breakfasts[idx], 500, 600 + idx, 'Quick and light breakfast option.')
    });
    foodItems.push({
      food_item_id: idx + 701,
      day,
      meal_type: 'Lunch',
      food_item: createMockFoodItem(idx + 701, lunches[idx], 900, 700 + idx, 'Nutritious office lunch.')
    });
  });

  return {
    id: 904,
    name: name || 'Standard Office Pack',
    category: 'Corporate',
    description: 'Affordable and healthy daily breakfast & lunch combo plan tailored for office environments.',
    dietary_preference: 'Standard',
    price: foodItems.reduce((sum, item) => sum + (item.food_item?.price || 0), 0),
    is_available: true,
    food_items: foodItems
  };
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
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
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
    setLoadError(false)
    try {
      const [ordersData, plansData] = await Promise.all([getOrders(), getMealPlans()])
      // Only show PENDING orders on this page
      setOrders(ordersData.filter((o) => o.status === 'PENDING'))
      setMealPlans(plansData)
    } catch (err) {
      console.error('Error fetching data:', err)
      setLoadError(true)
      showToast('Failed to load orders or meal plans.', 'error')
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

  const toggleSort = () => {
    setSortDirection((prev) => {
      if (prev === 'desc') return 'asc'
      return 'desc'
    })
  }

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortDirection) return 0
    const timeA = a.orderTimestamp ? new Date(a.orderTimestamp).getTime() : 0
    const timeB = b.orderTimestamp ? new Date(b.orderTimestamp).getTime() : 0
    return sortDirection === 'asc' ? timeA - timeB : timeB - timeA
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
        ) : loadError ? (
          <div role="alert" className="p-12 flex flex-col items-center justify-center gap-3 text-ink-soft">
            <ShoppingBag size={36} className="opacity-40" />
            <p className="text-sm font-semibold text-ink">Orders could not be loaded.</p>
            <p className="text-xs">Check your connection and try again.</p>
            <button
              onClick={fetchOrders}
              className="h-10 px-4 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-control transition-colors"
            >
              Retry
            </button>
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
                  <th className="px-6 py-4 w-[150px]">
                    <button
                      onClick={toggleSort}
                      className="flex items-center gap-1.5 hover:text-ink font-bold uppercase tracking-wider text-left cursor-pointer focus:outline-none transition-colors group"
                    >
                      Date
                      {sortDirection === 'asc' && (
                        <ArrowUp size={14} className="text-primary animate-in fade-in zoom-in duration-150" />
                      )}
                      {sortDirection === 'desc' && (
                        <ArrowDown size={14} className="text-primary animate-in fade-in zoom-in duration-150" />
                      )}
                      {sortDirection === null && (
                        <ArrowUpDown size={14} className="text-ink-soft/40 group-hover:text-ink-soft/80 transition-colors" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right w-[220px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-card">
                {sortedOrders.length > 0 ? (
                  sortedOrders.map((order) => {
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
                          <button
                            onClick={() => {
                              let plan = mealPlans.find(
                                (p) => p.name.toLowerCase() === order.mealPlan.toLowerCase()
                              )
                              if (!plan) {
                                plan = getFallbackMealPlan(order.mealPlan)
                              } else if (!plan.food_items || plan.food_items.length === 0) {
                                const fallback = getFallbackMealPlan(order.mealPlan)
                                plan = { ...plan, food_items: fallback.food_items }
                              }
                              setSelectedPlan(plan)
                            }}
                            className="text-[#0d7377] font-semibold hover:underline hover:text-[#0a5f62] text-left transition-colors cursor-pointer focus:outline-none"
                          >
                            {order.mealPlan}
                          </button>
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

      {/* ── Meal Plan Detail Modal ── */}
      {selectedPlan !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-5xl shadow-2xl border border-line bg-card overflow-hidden animate-in zoom-in-95 duration-200 rounded-[16px] flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-card shrink-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-xl font-extrabold text-ink leading-tight">
                    {selectedPlan.name}
                  </h3>
                  {selectedPlan.dietary_preference && (
                    <Badge variant="warning" className="px-2.5 py-0.5 text-xs font-bold rounded-full">
                      {selectedPlan.dietary_preference}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-ink-soft/90 mt-1 max-w-2xl">
                  {selectedPlan.description || 'No description provided for this meal plan.'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-ink-soft hover:text-ink cursor-pointer transition-colors p-1.5 rounded-full hover:bg-canvas/50 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto bg-canvas/30 flex-1">
              {/* Plan Metadata summary at top */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-line/85 bg-card mb-6 shadow-sm">
                <div className="flex items-center gap-2.5 text-ink-soft">
                  <CalendarDays size={18} className="text-[#0d7377]" />
                  <span className="text-sm font-semibold">
                    Schedule Range: <span className="text-ink font-bold">{getPlanWeekRange(selectedPlan)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-ink-soft font-medium">Total Price:</span>
                  <span className="text-2xl font-black text-[#0d7377]">
                    Rs. {selectedPlan.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Weekly Schedule */}
              <div className="mb-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#0d7377] mb-4">
                  Weekly Food Schedule
                </h4>
                <FoodItemsGrid plan={selectedPlan} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-line flex justify-end items-center bg-card shrink-0">
              <button
                onClick={() => setSelectedPlan(null)}
                className="h-10 px-6 bg-[#0d7377] hover:bg-[#0a5c60] text-white text-sm font-semibold rounded-control transition-all shadow-sm cursor-pointer active:scale-95"
              >
                Close Details
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default NewOrders
