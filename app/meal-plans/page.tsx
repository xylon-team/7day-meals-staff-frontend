'use client'

import React from 'react'
import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'

export default function MealPlansPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-ink-soft mb-1">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-ink font-medium">Meal Plans</span>
          </nav>
          <h1 className="text-2xl font-bold text-ink">Meal Plans</h1>
        </div>

        <Link
          href="/meal-plans/create-forms"
          className="flex items-center gap-2 px-4 py-2 bg-[#0d7377] hover:bg-[#0a5c60] text-white font-semibold rounded-lg text-sm shadow-sm transition-all"
        >
          <Plus size={16} /> Create Meal Plan
        </Link>
      </div>

      <div className="bg-[#faf8f5] border border-[#ebe5da] rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-[#0d7377]/10 flex items-center justify-center text-[#0d7377] mb-4">
          <CalendarDays size={28} />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">No Meal Plans Created Yet</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md">
          Create weekly prebuilt meal plans with custom breakfast, lunch, and dinner options for each day.
        </p>
        <Link
          href="/meal-plans/create-forms"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0d7377] hover:bg-[#0a5c60] text-white font-semibold rounded-lg text-sm shadow-sm transition-all"
        >
          <Plus size={16} /> Create Meal Plan
        </Link>
      </div>
    </div>
  )
}
