'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  CalendarDays,
  Loader2,
} from 'lucide-react'
import { useUserStore } from '@/store/user-store'
import { usePermission } from '@/lib/use-permission'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'

interface MealPlan {
  id: number
  name: string
  description: string
  dietary_preference: string
  is_active: boolean
  calculated_price: number
  created_at: string
}

const MOCK_PLANS: MealPlan[] = [
  {
    id: 1,
    name: 'Standard Office Week',
    description: 'A balanced weekly plan for office employees.',
    dietary_preference: 'Vegetarian',
    is_active: true,
    calculated_price: 9800,
    created_at: '2026-08-01',
  },
  {
    id: 2,
    name: 'Vegan Boost',
    description: 'Plant-based high-protein plan.',
    dietary_preference: 'Vegan',
    is_active: true,
    calculated_price: 10500,
    created_at: '2026-08-05',
  },
  {
    id: 3,
    name: 'Gluten-Free Classic',
    description: 'Safe and satisfying meals for gluten-intolerant staff.',
    dietary_preference: 'Gluten-Free',
    is_active: false,
    calculated_price: 11200,
    created_at: '2026-08-07',
  },
]

const DIETARY_BADGE: Record<string, 'success' | 'info' | 'warning'> = {
  Vegetarian: 'success',
  Vegan: 'info',
  'Gluten-Free': 'warning',
}

export function MealPlans() {
  const router = useRouter()
  const { user } = useUserStore()

  const canView = usePermission('meal_package', 'view')
  const canAdd = usePermission('meal_package', 'add')
  const canChange = usePermission('meal_package', 'change')
  const canDelete = usePermission('meal_package', 'delete')

  useEffect(() => {
    if (!user) router.push('/login')
    else if (!canView) router.push('/dashboard')
  }, [user, canView, router])

  const [plans, setPlans] = useState<MealPlan[]>(MOCK_PLANS)
  const [loading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filtered = plans.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.dietary_preference.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleActive = (id: number, name: string, current: boolean) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p))
    )
    showToast(`"${name}" is now ${!current ? 'enabled' : 'disabled'}.`)
  }

  const handleDelete = (id: number) => {
    const target = plans.find((p) => p.id === id)
    setPlans((prev) => prev.filter((p) => p.id !== id))
    setDeleteConfirm(null)
    showToast(`"${target?.name}" deleted.`)
  }

  if (!user || !canView) return null

  return (
    <div className="space-y-8">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#0d7377] text-white px-4 py-3 rounded-card shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check size={18} />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div>
        <nav className="flex items-center gap-2 text-xs text-ink-soft mb-2">
          <span
            className="cursor-pointer hover:underline"
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </span>
          <span>/</span>
          <span className="text-ink font-medium">Meal Plans</span>
        </nav>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-ink">Meal Plans</h2>
          {canAdd && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/prebuilt-meals/create-forms')}
              className="flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Create Plan
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-line bg-card flex items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meal plans..."
              className="h-10 pl-10 pr-4 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full transition-all text-ink placeholder:text-ink-soft"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-ink-soft">
            <Loader2 className="animate-spin text-primary" size={24} />
            <span className="text-sm font-medium">Loading meal plans...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-line text-ink-soft text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Plan Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Dietary Preference</th>
                  <th className="px-6 py-4 w-[120px]">Total Price</th>
                  <th className="px-6 py-4 text-center w-[110px]">Status</th>
                  <th className="px-6 py-4 text-right w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-card">
                {filtered.length > 0 ? (
                  filtered.map((plan) => (
                    <tr key={plan.id} className="hover:bg-canvas/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <CalendarDays size={16} />
                          </div>
                          <span className="font-bold text-ink">{plan.name}</span>
                        </div>
                      </td>

                      <td
                        className="px-6 py-4 text-ink-soft max-w-[200px] truncate"
                        title={plan.description}
                      >
                        {plan.description}
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={DIETARY_BADGE[plan.dietary_preference] ?? 'info'}>
                          {plan.dietary_preference}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold text-ink-soft leading-none">Rs.</span>
                          <span className="text-sm font-bold text-ink mt-0.5">
                            {plan.calculated_price.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <button
                            disabled={!canChange}
                            onClick={() =>
                              handleToggleActive(plan.id, plan.name, plan.is_active)
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              plan.is_active ? 'bg-primary-light' : 'bg-line'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                plan.is_active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-ink-soft">
                        <div className="flex items-center justify-end gap-4">
                          {canChange && (
                            <button
                              onClick={() =>
                                router.push(`/prebuilt-meals/create-forms`)
                              }
                              className="hover:text-ink transition-colors cursor-pointer"
                              title="Edit Plan"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirm(plan.id)}
                              className="text-danger-fg hover:text-danger-fg/80 transition-colors cursor-pointer"
                              title="Delete Plan"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-ink-soft">
                      No meal plans found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl border border-line bg-card overflow-hidden animate-in zoom-in-95 duration-200 rounded-xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-ink mb-2">Delete Meal Plan?</h3>
              <p className="text-sm text-ink-soft mb-6">
                Are you sure you want to delete this meal plan? This action is permanent and
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  Delete Plan
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default MealPlans
