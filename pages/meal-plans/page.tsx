'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Badge } from '@/components/Badge'
import {
  Plus, Edit2, Trash2, CalendarDays, Loader2, Check, ChevronDown, UtensilsCrossed,
} from 'lucide-react'
import { getMealPlans, createMealPlan, updateMealPlan, deleteMealPlan, deactivateMealPlan } from '@/lib/api/meal-plans'
import { MealPlan, MealPlanFoodItem } from '@/lib/types/meal-plans'
import { getMeals } from '@/lib/api/meals'
import { Meal } from '@/lib/types/meals'
import { useUserStore } from '@/store/user-store'
import { usePermission } from '@/lib/use-permission'
import { useRouter } from 'next/navigation'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'] as const

const MEAL_TYPE_BADGE: Record<string, string> = {
  Breakfast: 'bg-amber-100 text-amber-700',
  Lunch: 'bg-emerald-100 text-emerald-700',
  Dinner: 'bg-indigo-100 text-indigo-700',
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
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

// ─── Food‑items weekly schedule panel ───────────────────────────────────────────
function FoodItemsPanel({ plan }: { plan: MealPlan }) {
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
      <div className="flex flex-col items-center justify-center py-10 text-ink-soft gap-2">
        <UtensilsCrossed size={32} className="opacity-30" />
        <p className="text-sm">No food items assigned to this plan yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {activeDays.map(day => (
        <div key={day} className="rounded-xl border border-line bg-card overflow-hidden shadow-sm">
          {/* Day header */}
          <div className="bg-gradient-to-r from-[#0d7377]/10 to-transparent px-4 py-2.5 border-b border-line">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0d7377]">{day}</span>
          </div>

          {/* Meal slots */}
          <div className="divide-y divide-line/60">
            {MEAL_TYPES.map(mealType => {
              const slot = schedule[day]?.[mealType]
              if (!slot) return null
              const fi = slot.food_item

              return (
                <div key={mealType} className="p-3 flex gap-3 items-start">
                  {/* Food image */}
                  {fi?.image_url ? (
                    <img
                      src={fi.image_url}
                      alt={fi.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-line shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-line/40 flex items-center justify-center shrink-0">
                      <UtensilsCrossed size={18} className="text-ink-soft/40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span
                      className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1 ${MEAL_TYPE_BADGE[mealType]}`}
                    >
                      {mealType}
                    </span>
                    <p className="text-sm font-medium text-ink leading-tight truncate">
                      {fi?.name ?? `Food item #${slot.food_item_id}`}
                    </p>
                    {fi?.price !== undefined && (
                      <p className="text-xs text-ink-soft mt-0.5">Rs. {fi.price.toLocaleString()}</p>
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

// ─── Main component ──────────────────────────────────────────────────────────────
export function MealPlans() {
  const router = useRouter()
  const { user, hasHydrated } = useUserStore()

  const [isCreating, setIsCreating] = useState(false)
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null)

  // Edit state
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null)
  const [editName, setEditName] = useState('')
  const [createCategory, setCreateCategory] = useState('')
  const [editDietaryPreference, setEditDietaryPreference] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsAvailable, setEditIsAvailable] = useState(true)
  const [editSelectedMeals, setEditSelectedMeals] = useState<Record<string, Record<string, number>>>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const canView = usePermission('meal_package', 'view')
  const canAdd = usePermission('meal_package', 'add')
  const canChange = usePermission('meal_package', 'change')
  const canDelete = usePermission('meal_package', 'delete')

  useEffect(() => {
    if (!hasHydrated) return
    if (!user) {
      router.push('/login')
    } else if (user.permissions !== undefined && !canView) {
      router.push('/dashboard')
    }
  }, [user, canView, hasHydrated, router])

  useEffect(() => {
    if (canView) loadData()
  }, [canView])

  const loadData = async () => {
    setLoading(true)
    try {
      const [plansData, mealsData] = await Promise.all([getMealPlans(), getMeals()])
      setMealPlans(plansData)
      setMeals(mealsData)
    } catch (error) {
      console.error('Failed to load meal plans and meals:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleStartEdit = (plan: MealPlan) => {
    setEditingPlan(plan)
    setEditName(plan.name)
    setEditDietaryPreference(plan.dietary_preference || '')
    setEditDescription(plan.description || '')
    setEditIsAvailable(plan.is_available)

    const initialSelected: Record<string, Record<string, number>> = {
      Monday: { Breakfast: 0, Lunch: 0, Dinner: 0 },
      Tuesday: { Breakfast: 0, Lunch: 0, Dinner: 0 },
      Wednesday: { Breakfast: 0, Lunch: 0, Dinner: 0 },
      Thursday: { Breakfast: 0, Lunch: 0, Dinner: 0 },
      Friday: { Breakfast: 0, Lunch: 0, Dinner: 0 },
      Saturday: { Breakfast: 0, Lunch: 0, Dinner: 0 },
      Sunday: { Breakfast: 0, Lunch: 0, Dinner: 0 },
    }
    plan.food_items?.forEach(item => {
      if (initialSelected[item.day]) initialSelected[item.day][item.meal_type] = item.food_item_id
    })
    setEditSelectedMeals(initialSelected)
  }

  const handleStartCreate = () => {
    setEditName('')
    setCreateCategory('')
    setEditDietaryPreference('')
    setEditDescription('')
    setEditIsAvailable(true)
    setEditSelectedMeals(Object.fromEntries(
      DAYS.map(day => [day, { Breakfast: 0, Lunch: 0, Dinner: 0 }]),
    ))
    setIsCreating(true)
  }

  const handleMealSelectChange = (day: string, mealType: string, val: string) => {
    const mealId = val ? Number(val) : 0
    setEditSelectedMeals(prev => ({ ...prev, [day]: { ...prev[day], [mealType]: mealId } }))
  }

  const calculatedPrice = Object.values(editSelectedMeals).reduce((total, dayMeals) => {
    return (
      total +
      Object.values(dayMeals).reduce((dayTotal, mealId) => {
        if (mealId) {
          const meal = meals.find(m => m.id === mealId)
          return dayTotal + (meal ? meal.price : 0)
        }
        return dayTotal
      }, 0)
    )
  }, 0)

  const handleUpdatePlan = async () => {
    if (!editingPlan) return
    if (!editName.trim()) { showToast('Plan name is required'); return }

    const foodItemsPayload = Object.entries(editSelectedMeals).flatMap(([day, dayMeals]) =>
      Object.entries(dayMeals)
        .filter(([, mealId]) => mealId > 0)
        .map(([mealType, food_item_id]) => ({ food_item_id, day, meal_type: mealType })),
    )
    if (foodItemsPayload.length === 0) {
      showToast('Select at least one meal for the plan')
      return
    }

    setIsUpdating(true)
    try {
      await updateMealPlan(editingPlan.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        dietary_preference: editDietaryPreference,
        price: calculatedPrice,
        is_available: editIsAvailable,
        food_items: foodItemsPayload,
        category: editingPlan.category,
      })
      showToast('Meal plan updated successfully!')
      const updatedPlans = await getMealPlans()
      setMealPlans(updatedPlans)
      setEditingPlan(null)
    } catch (error) {
      console.error('Failed to update meal plan:', error)
      showToast('Failed to update meal plan')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCreatePlan = async () => {
    if (!editName.trim()) { showToast('Plan name is required'); return }
    if (!createCategory.trim()) { showToast('Category is required'); return }
    if (!editDescription.trim()) { showToast('Description is required'); return }
    if (!editDietaryPreference) { showToast('Dietary preference is required'); return }

    const foodItemsPayload = Object.entries(editSelectedMeals).flatMap(([day, dayMeals]) =>
      Object.entries(dayMeals)
        .filter(([, mealId]) => mealId > 0)
        .map(([mealType, food_item_id]) => ({ food_item_id, day, meal_type: mealType })),
    )
    if (foodItemsPayload.length === 0) {
      showToast('Select at least one meal for the plan')
      return
    }

    setIsSaving(true)
    try {
      await createMealPlan({
        name: editName.trim(),
        category: createCategory.trim(),
        description: editDescription.trim(),
        dietary_preference: editDietaryPreference,
        price: calculatedPrice,
        is_available: editIsAvailable,
        food_items: foodItemsPayload,
      })
      setMealPlans(await getMealPlans())
      setIsCreating(false)
      showToast('Meal plan created successfully!')
    } catch (error) {
      console.error('Failed to create meal plan:', error)
      showToast('Failed to create meal plan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePlan = async (id: number) => {
    try {
      await deleteMealPlan(id)
      setMealPlans(prev => prev.filter(p => p.id !== id))
      showToast('Meal plan deleted successfully!')
      setDeleteConfirm(null)
      if (editingPlan && editingPlan.id === id) {
        setEditingPlan(null)
      }
    } catch (err: any) {
      if (err.status === 409 || err.message === 'CONFLICT') {
        showToast('Plan is in use. Deactivating instead...')
        try {
          await deactivateMealPlan(id)
          setMealPlans(prev => prev.map(p => (p.id === id ? { ...p, is_available: false } : p)))
          showToast('Meal plan deactivated successfully!')
          setDeleteConfirm(null)
          if (editingPlan && editingPlan.id === id) {
            setEditIsAvailable(false)
          }
        } catch (deactivateErr) {
          console.error(deactivateErr)
          showToast('Failed to deactivate meal plan')
        }
      } else {
        console.error(err)
        showToast('Failed to delete meal plan')
      }
    }
  }

  const handleToggleAvailability = async (id: number, currentStatus: boolean, name: string) => {
    try {
      const newStatus = !currentStatus
      if (newStatus === false) {
        await deactivateMealPlan(id)
      } else {
        await updateMealPlan(id, { is_available: newStatus })
      }
      setMealPlans(prev => prev.map(p => (p.id === id ? { ...p, is_available: newStatus } : p)))
      showToast(`"${name}" is now ${newStatus ? 'Active' : 'Draft'}.`)
    } catch (err) {
      console.error(err)
      showToast('Failed to change availability.')
    }
  }

  const toggleExpand = (id: number) =>
    setExpandedPlanId(prev => (prev === id ? null : id))

  // ─── Create view ────────────────────────────────────────────────────────────
  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-ink">Create Meal Plan</h2>
          <div className="space-x-3">
            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Plan'}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Plan Name</label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Standard Office Week" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Category</label>
                <Input value={createCategory} onChange={e => setCreateCategory(e.target.value)} placeholder="e.g. Weekly" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Dietary Preferences</label>
                <select
                  value={editDietaryPreference}
                  onChange={e => setEditDietaryPreference(e.target.value)}
                  className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select dietary preference...</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                  <option value="Dairy-Free">Dairy-Free</option>
                  <option value="Halal">Halal</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
                <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Brief description of the plan" />
              </div>
            </div>

            <div className="border-t border-line pt-6">
              <h3 className="font-semibold mb-4">Daily Configuration</h3>
              <div className="space-y-4">
                {DAYS.map(day => (
                  <div
                    key={day}
                    className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-canvas rounded-card border border-line"
                  >
                    <div className="w-24 font-medium">{day}</div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                      <select aria-label={`${day} Breakfast`} value={editSelectedMeals[day]?.Breakfast || ''} onChange={e => handleMealSelectChange(day, 'Breakfast', e.target.value)} className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Select Breakfast...</option>
                        {meals.map(meal => <option key={meal.id} value={meal.id}>{meal.name}</option>)}
                      </select>
                      <select aria-label={`${day} Lunch`} value={editSelectedMeals[day]?.Lunch || ''} onChange={e => handleMealSelectChange(day, 'Lunch', e.target.value)} className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Select Lunch...</option>
                        {meals.map(meal => <option key={meal.id} value={meal.id}>{meal.name}</option>)}
                      </select>
                      <select aria-label={`${day} Dinner`} value={editSelectedMeals[day]?.Dinner || ''} onChange={e => handleMealSelectChange(day, 'Dinner', e.target.value)} className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Select Dinner...</option>
                        {meals.map(meal => <option key={meal.id} value={meal.id}>{meal.name}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-line pt-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={editIsAvailable} onChange={e => setEditIsAvailable(e.target.checked)} className="w-4 h-4 text-primary border-line rounded focus:ring-primary" />
                <label htmlFor="active" className="text-sm font-medium">Enable Plan</label>
              </div>
              <div className="text-right">
                <p className="text-sm text-ink-soft mb-1">Calculated Total Price</p>
                <p className="text-2xl font-bold text-primary">Rs. {calculatedPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Edit view ──────────────────────────────────────────────────────────────
  if (editingPlan) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-ink">Update Meal Plan</h2>
          <div className="space-x-3 flex items-center">
            {canDelete && (
              <button
                onClick={() => setDeleteConfirm(editingPlan.id)}
                className="text-sm font-semibold text-red-500 hover:text-red-700 hover:underline cursor-pointer bg-transparent border-0 outline-none px-4 py-2"
              >
                Delete
              </button>
            )}
            <button
              onClick={() => setEditingPlan(null)}
              className="text-sm font-semibold text-[#0d7377] hover:text-[#0a5c60] hover:underline cursor-pointer bg-transparent border-0 outline-none px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePlan}
              disabled={isUpdating}
              className="h-10 px-5 bg-[#0d7377] hover:bg-[#0a5c60] text-white text-sm font-semibold rounded-control transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isUpdating ? 'Updating...' : 'Update Plan'}
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Plan Name</label>
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Standard Office Week"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Dietary Preferences</label>
                <select
                  value={editDietaryPreference}
                  onChange={e => setEditDietaryPreference(e.target.value)}
                  className="w-full h-10 px-3 rounded-control border border-line bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">e.g. Vegetarian, Gluten-Free</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                  <option value="Dairy-Free">Dairy-Free</option>
                  <option value="Halal">Halal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Description</label>
              <Input
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Brief description of the plan"
                className="bg-white"
              />
            </div>

            <div className="border-t border-line pt-6">
              <h3 className="font-semibold text-ink mb-4">Daily Configuration</h3>
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <div
                    key={day}
                    className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-canvas rounded-card border border-line"
                  >
                    <div className="w-24 font-medium text-ink">{day}</div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                      {['Breakfast', 'Lunch', 'Dinner'].map(mealType => (
                        <select
                          key={mealType}
                          value={editSelectedMeals[day]?.[mealType] || ''}
                          onChange={e => handleMealSelectChange(day, mealType, e.target.value)}
                          className="w-full h-10 px-3 rounded-control border border-line bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        >
                          <option value="">Select {mealType}...</option>
                          {meals.map(meal => (
                            <option key={meal.id} value={meal.id}>{meal.name}</option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-line pt-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editIsAvailable}
                  onChange={e => setEditIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-primary border-line rounded focus:ring-primary accent-[#0d7377] cursor-pointer"
                />
                <label htmlFor="active" className="text-sm font-medium text-ink cursor-pointer">Enable Plan</label>
              </div>
              <div className="text-right">
                <p className="text-sm text-ink-soft mb-1">Calculated Total Price</p>
                <p className="text-2xl font-bold text-primary">
                  Rs. {calculatedPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Main list view ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-ink">Meal Plans</h2>
        {canAdd && (
          <Button onClick={handleStartCreate}>
            <Plus size={18} className="mr-2" /> Create Plan
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-ink-soft">
              <Loader2 size={32} className="animate-spin mb-4 text-primary" />
              <p>Loading meal plans...</p>
            </div>
          ) : mealPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-ink-soft">
              <p>No meal plans found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[12px] uppercase text-ink-soft bg-canvas font-semibold">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-card w-10"></th>
                    <th className="px-6 py-3">Plan Name</th>
                    <th className="px-6 py-3">Week Range</th>
                    <th className="px-6 py-3">Meals</th>
                    <th className="px-6 py-3">Dietary Preference</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right rounded-tr-card">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mealPlans.map(p => {
                    const isExpanded = expandedPlanId === p.id
                    const mealsCount = p.food_items?.length || 0

                    return (
                      <React.Fragment key={p.id}>
                        {/* ── Summary row ── */}
                        <tr
                          className={`border-t border-line transition-colors cursor-pointer select-none ${
                            isExpanded ? 'bg-[#0d7377]/5' : 'hover:bg-canvas/50'
                          }`}
                          onClick={() => toggleExpand(p.id)}
                        >
                          {/* Expand chevron */}
                          <td className="pl-4 pr-2 py-4 w-10">
                            <div
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            >
                              <ChevronDown size={16} className="text-ink-soft" />
                            </div>
                          </td>

                          <td className="px-6 py-4 font-medium">
                            <div className="flex items-center gap-2">
                              <CalendarDays size={16} className="text-primary shrink-0" />
                              <span>{p.name}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-ink-soft">{getPlanWeekRange(p)}</td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                mealsCount > 0
                                  ? 'bg-[#0d7377]/10 text-[#0d7377]'
                                  : 'bg-line/40 text-ink-soft'
                              }`}
                            >
                              <UtensilsCrossed size={11} />
                              {mealsCount} meal{mealsCount !== 1 ? 's' : ''}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {p.dietary_preference ? (
                              <Badge variant="warning" className="px-2.5 py-0.5 text-xs font-semibold rounded-full">
                                {p.dietary_preference}
                              </Badge>
                            ) : (
                              <span className="text-ink-soft/50 text-xs italic">None</span>
                            )}
                          </td>

                          <td className="px-6 py-4 font-medium">Rs. {p.price.toLocaleString()}</td>

                          {/* Availability toggle — stop propagation so clicking toggle doesn't expand */}
                          <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={p.is_available}
                                aria-label={`Availability for ${p.name}`}
                                disabled={!canChange}
                                onClick={() => handleToggleAvailability(p.id, p.is_available, p.name)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                  p.is_available ? 'bg-primary-light' : 'bg-line'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    p.is_available ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          </td>

                          {/* Actions — stop propagation */}
                          <td className="px-6 py-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                            {canChange && (
                              <button
                                onClick={() => handleStartEdit(p)}
                                className="text-ink-soft hover:text-primary p-1 cursor-pointer"
                                title="Edit Plan"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteConfirm(p.id)}
                                className="text-ink-soft hover:text-danger-fg p-1 cursor-pointer"
                                title="Delete Plan"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* ── Expanded detail row ── */}
                        {isExpanded && (
                          <tr className="border-t border-[#0d7377]/20 bg-[#0d7377]/[0.03]">
                            <td colSpan={8} className="px-6 py-5">
                              {/* Section header */}
                              <div className="mb-4 flex items-center gap-3">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#0d7377]">
                                  Weekly Schedule
                                </span>
                                <div className="flex-1 h-px bg-[#0d7377]/20" />
                                <span className="text-xs text-ink-soft">
                                  {mealsCount} food item{mealsCount !== 1 ? 's' : ''} assigned
                                </span>
                              </div>
                              <FoodItemsPanel plan={p} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl border border-line bg-card overflow-hidden animate-in zoom-in-95 duration-200 rounded-xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-ink mb-2">Delete Meal Plan?</h3>
              <p className="text-sm text-ink-soft mb-6">
                Are you sure you want to delete this meal plan? This action is permanent and cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button variant="danger" size="sm" onClick={() => handleDeletePlan(deleteConfirm)}>Delete Plan</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Toast notification ── */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#0d7377] text-white px-4 py-3 rounded-card shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check size={18} />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default MealPlans
