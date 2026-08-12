'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Badge } from '@/components/Badge'
import { Plus, Edit2, Trash2, CalendarDays } from 'lucide-react'

const mockPlans = [
  {
    id: '1',
    name: 'Standard Office Week',
    meals: 15,
    price: 12500,
    weeks: 'Mon-Fri',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Full Week Premium',
    meals: 21,
    price: 18000,
    weeks: 'Mon-Sun',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Weekend Special',
    meals: 6,
    price: 5500,
    weeks: 'Sat-Sun',
    status: 'Draft',
  },
]

export function MealPlans() {
  const [isCreating, setIsCreating] = useState(false)

  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-ink">Create Meal Plan</h2>
          <div className="space-x-3">
            <Button variant="ghost" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreating(false)}>Save Plan</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Plan Name
                </label>
                <Input placeholder="e.g. Standard Office Week" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Description
                </label>
                <Input placeholder="Brief description of the plan" />
              </div>
            </div>

            <div className="border-t border-line pt-6">
              <h3 className="font-semibold mb-4">Daily Configuration</h3>
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(
                  (day) => (
                    <div
                      key={day}
                      className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-canvas rounded-card border border-line"
                    >
                      <div className="w-24 font-medium">{day}</div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                        <select className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="">Select Breakfast...</option>
                          <option>String Hoppers</option>
                          <option>Milk Rice</option>
                        </select>
                        <select className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="">Select Lunch...</option>
                          <option>Chicken Fried Rice</option>
                          <option>Rice & Curry</option>
                        </select>
                        <select className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="">Select Dinner...</option>
                          <option>Kottu</option>
                          <option>Noodles</option>
                        </select>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="border-t border-line pt-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  defaultChecked
                  className="w-4 h-4 text-primary border-line rounded focus:ring-primary"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Enable Plan
                </label>
              </div>
              <div className="text-right">
                <p className="text-sm text-ink-soft mb-1">
                  Calculated Total Price
                </p>
                <p className="text-2xl font-bold text-primary">Rs. 0.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-ink">Meal Plans</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus size={18} className="mr-2" /> Create Plan
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[12px] uppercase text-ink-soft bg-canvas font-semibold">
                <tr>
                  <th className="px-6 py-3 rounded-tl-card">Plan Name</th>
                  <th className="px-6 py-3">Week Range</th>
                  <th className="px-6 py-3">Meals</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right rounded-tr-card">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {mockPlans.map((p) => (
                  <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <CalendarDays size={16} className="text-primary" />{' '}
                      {p.name}
                    </td>
                    <td className="px-6 py-4 text-ink-soft">{p.weeks}</td>
                    <td className="px-6 py-4">{p.meals} meals</td>
                    <td className="px-6 py-4 font-medium">Rs. {p.price}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={p.status === 'Active' ? 'success' : 'default'}
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="text-ink-soft hover:text-primary p-1">
                        <Edit2 size={16} />
                      </button>
                      <button className="text-ink-soft hover:text-danger-fg p-1">
                        <Trash2 size={16} />
                      </button>
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

export default MealPlans
