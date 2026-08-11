'use client'

import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function PrebuiltMealsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Meal Plans</h1>
        <Link
          href="/prebuilt-meals/create-forms"
          className="flex items-center gap-2 px-4 py-2 bg-[#0d7377] hover:bg-[#0a5c60] text-white font-semibold rounded-lg text-sm shadow-sm transition-all"
        >
          <Plus size={16} /> Create Meal Plan
        </Link>
      </div>

      <div className="bg-[#faf8f5] border border-[#ebe5da] rounded-2xl p-12 text-center">
        <h2 className="text-lg font-bold text-gray-800 mb-2">No Meal Plans Created Yet</h2>
        <p className="text-sm text-gray-500 mb-6">
          Start by building a prebuilt weekly meal plan.
        </p>
        <Link
          href="/prebuilt-meals/create-forms"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0d7377] hover:bg-[#0a5c60] text-white font-semibold rounded-lg text-sm shadow-sm transition-all"
        >
          <Plus size={16} /> Create New Plan
        </Link>
      </div>
    </div>
  )
}
