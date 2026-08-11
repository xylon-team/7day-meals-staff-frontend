'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check } from 'lucide-react'

// Meal price mapping for dynamic price calculation
const MEAL_PRICES: Record<string, number> = {
    'String Hoppers': 350,
    'Milk Rice': 300,
    'Chicken Fried Rice': 650,
    'Rice & Curry': 450,
    'Kottu': 550,
    'Noodles': 500,
}

// Days of the week for configuration
const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
]

// Dropdown meal options per category as specified
const BREAKFAST_OPTIONS = ['String Hoppers', 'Milk Rice']
const LUNCH_OPTIONS = ['Chicken Fried Rice', 'Rice & Curry']
const DINNER_OPTIONS = ['Kottu', 'Noodles']

interface DayPlan {
    breakfast: string
    lunch: string
    dinner: string
}

export default function CreateMealPlanPage() {
    const router = useRouter()

    // Form State
    const [planName, setPlanName] = useState('')
    const [description, setDescription] = useState('')
    const [enablePlan, setEnablePlan] = useState(false)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    // Daily Meal Selections State
    const [dailyMeals, setDailyMeals] = useState<Record<string, DayPlan>>({
        Monday: { breakfast: '', lunch: '', dinner: '' },
        Tuesday: { breakfast: '', lunch: '', dinner: '' },
        Wednesday: { breakfast: '', lunch: '', dinner: '' },
        Thursday: { breakfast: '', lunch: '', dinner: '' },
        Friday: { breakfast: '', lunch: '', dinner: '' },
        Saturday: { breakfast: '', lunch: '', dinner: '' },
        Sunday: { breakfast: '', lunch: '', dinner: '' },
    })

    // Update specific meal for a day
    const handleMealChange = (day: string, mealType: 'breakfast' | 'lunch' | 'dinner', value: string) => {
        setDailyMeals((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                [mealType]: value,
            },
        }))
    }

    // Calculate dynamic total price across all selected meals for all 7 days
    const calculatedTotalPrice = useMemo(() => {
        let total = 0
        Object.values(dailyMeals).forEach((dayPlan) => {
            if (dayPlan.breakfast && MEAL_PRICES[dayPlan.breakfast]) {
                total += MEAL_PRICES[dayPlan.breakfast]
            }
            if (dayPlan.lunch && MEAL_PRICES[dayPlan.lunch]) {
                total += MEAL_PRICES[dayPlan.lunch]
            }
            if (dayPlan.dinner && MEAL_PRICES[dayPlan.dinner]) {
                total += MEAL_PRICES[dayPlan.dinner]
            }
        })
        return total
    }, [dailyMeals])

    // Show Toast helper
    const triggerToast = (msg: string) => {
        setToastMessage(msg)
        setTimeout(() => {
            setToastMessage(null)
        }, 3500)
    }

    // Action handlers
    const handleSavePlan = (e: React.FormEvent) => {
        e.preventDefault()
        triggerToast('Meal plan saved successfully!')
    }

    const handleCancel = () => {
        setPlanName('')
        setDescription('')
        setEnablePlan(false)
        setDailyMeals({
            Monday: { breakfast: '', lunch: '', dinner: '' },
            Tuesday: { breakfast: '', lunch: '', dinner: '' },
            Wednesday: { breakfast: '', lunch: '', dinner: '' },
            Thursday: { breakfast: '', lunch: '', dinner: '' },
            Friday: { breakfast: '', lunch: '', dinner: '' },
            Saturday: { breakfast: '', lunch: '', dinner: '' },
            Sunday: { breakfast: '', lunch: '', dinner: '' },
        })
        triggerToast('Form cleared.')
    }

    return (
        <div className="max-w-6xl mx-auto py-4 sm:py-6 px-2 sm:px-4 space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0d7377] text-white px-4 py-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <Check size={18} />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Top Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1f2937] tracking-tight">
                    Create Meal Plan
                </h1>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-semibold text-[#0d7377] hover:text-[#0a5c60] hover:underline transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSavePlan}
                        className="px-5 py-2.5 bg-[#0d7377] hover:bg-[#0a5c60] text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                        Save Plan
                    </button>
                </div>
            </div>

            {/* Main Off-White Form Card */}
            <div className="bg-[#faf8f5] border border-[#ebe5da] rounded-2xl p-6 sm:p-8 shadow-xs">
                <form onSubmit={handleSavePlan} className="space-y-6">
                    {/* Plan Name & Description Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Plan Name
                            </label>
                            <input
                                type="text"
                                value={planName}
                                onChange={(e) => setPlanName(e.target.value)}
                                placeholder="e.g. Standard Office Week"
                                className="w-full px-4 py-2.5 bg-white border border-[#ded8cb] rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d7377] focus:border-transparent transition-all shadow-2xs"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of the plan"
                                className="w-full px-4 py-2.5 bg-white border border-[#ded8cb] rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d7377] focus:border-transparent transition-all shadow-2xs"
                            />
                        </div>
                    </div>

                    {/* Daily Configuration Section */}
                    <div className="pt-2">
                        <h2 className="text-base font-bold text-gray-900 mb-4">
                            Daily Configuration
                        </h2>

                        <div className="space-y-3">
                            {DAYS_OF_WEEK.map((day) => (
                                <div
                                    key={day}
                                    className="bg-[#f4efe6] rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4 transition-colors"
                                >
                                    {/* Day Label */}
                                    <div className="w-28 shrink-0 font-bold text-gray-800 text-sm sm:text-base px-1">
                                        {day}
                                    </div>

                                    {/* 3 Meal Dropdown Selects */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                                        {/* Breakfast Select */}
                                        <div className="relative w-full">
                                            <select
                                                value={dailyMeals[day].breakfast}
                                                onChange={(e) => handleMealChange(day, 'breakfast', e.target.value)}
                                                className={`w-full h-11 px-4 pr-10 bg-white border border-[#ded8cb] rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d7377] focus:border-transparent transition-all shadow-2xs ${dailyMeals[day].breakfast ? 'text-gray-800 font-medium' : 'text-gray-400'
                                                    }`}
                                            >
                                                <option value="" disabled hidden>
                                                    Select Breakfast...
                                                </option>
                                                {BREAKFAST_OPTIONS.map((option) => (
                                                    <option key={option} value={option} className="text-gray-800 font-normal">
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800 pointer-events-none stroke-[2.5]" />
                                        </div>

                                        {/* Lunch Select */}
                                        <div className="relative w-full">
                                            <select
                                                value={dailyMeals[day].lunch}
                                                onChange={(e) => handleMealChange(day, 'lunch', e.target.value)}
                                                className={`w-full h-11 px-4 pr-10 bg-white border border-[#ded8cb] rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d7377] focus:border-transparent transition-all shadow-2xs ${dailyMeals[day].lunch ? 'text-gray-800 font-medium' : 'text-gray-400'
                                                    }`}
                                            >
                                                <option value="" disabled hidden>
                                                    Select Lunch...
                                                </option>
                                                {LUNCH_OPTIONS.map((option) => (
                                                    <option key={option} value={option} className="text-gray-800 font-normal">
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800 pointer-events-none stroke-[2.5]" />
                                        </div>

                                        {/* Dinner Select */}
                                        <div className="relative w-full">
                                            <select
                                                value={dailyMeals[day].dinner}
                                                onChange={(e) => handleMealChange(day, 'dinner', e.target.value)}
                                                className={`w-full h-11 px-4 pr-10 bg-white border border-[#ded8cb] rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d7377] focus:border-transparent transition-all shadow-2xs ${dailyMeals[day].dinner ? 'text-gray-800 font-medium' : 'text-gray-400'
                                                    }`}
                                            >
                                                <option value="" disabled hidden>
                                                    Select Dinner...
                                                </option>
                                                {DINNER_OPTIONS.map((option) => (
                                                    <option key={option} value={option} className="text-gray-800 font-normal">
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800 pointer-events-none stroke-[2.5]" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer controls: Enable Plan & Calculated Total Price */}
                    <div className="pt-6 border-t border-[#ebe5da] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={enablePlan}
                                onChange={(e) => setEnablePlan(e.target.checked)}
                                className="w-4 h-4 rounded border-[#ded8cb] text-[#0d7377] accent-[#0d7377] focus:ring-[#0d7377] cursor-pointer"
                            />
                            <span className="text-sm font-semibold text-gray-800">
                                Enable Plan
                            </span>
                        </label>

                        <div className="text-left sm:text-right w-full sm:w-auto">
                            <div className="text-xs font-semibold text-gray-500 mb-0.5">
                                Calculated Total Price
                            </div>
                            <div className="text-2xl font-bold text-[#0d7377] tracking-tight">
                                Rs. {calculatedTotalPrice.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
