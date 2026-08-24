'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, Loader2 } from 'lucide-react'
import { getMeals } from '@/lib/api/meals'
import { createMealPlan } from '@/lib/api/meal-plans'

// Default Meal price mapping
const DEFAULT_MEAL_PRICES: Record<string, number> = {
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

const DEFAULT_BREAKFAST_OPTIONS = ['String Hoppers', 'Milk Rice']
const DEFAULT_LUNCH_OPTIONS = ['Chicken Fried Rice', 'Rice & Curry']
const DEFAULT_DINNER_OPTIONS = ['Kottu', 'Noodles']
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free']

interface DayPlan {
    breakfast: string
    lunch: string
    dinner: string
}

const EMPTY_WEEK: Record<string, DayPlan> = {
    Monday: { breakfast: '', lunch: '', dinner: '' },
    Tuesday: { breakfast: '', lunch: '', dinner: '' },
    Wednesday: { breakfast: '', lunch: '', dinner: '' },
    Thursday: { breakfast: '', lunch: '', dinner: '' },
    Friday: { breakfast: '', lunch: '', dinner: '' },
    Saturday: { breakfast: '', lunch: '', dinner: '' },
    Sunday: { breakfast: '', lunch: '', dinner: '' },
}

// Custom Dropdown Component for Pixel-Perfect Cross-Browser Rendering
function CustomSelect({
    value,
    placeholder,
    options,
    onChange,
}: {
    value: string
    placeholder: string
    options: string[]
    onChange: (val: string) => void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={dropdownRef} className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-lg text-sm flex items-center justify-between shadow-sm hover:border-[#CBD5E1] transition-all cursor-pointer text-left"
            >
                <span className={value ? 'text-[#1E293B] font-medium' : 'text-[#475569]'}>
                    {value || placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-[#1E293B] stroke-[2.5] shrink-0 ml-2" />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-40 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1 animate-in fade-in duration-150">
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => {
                                onChange(option)
                                setIsOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center justify-between ${value === option
                                ? 'bg-[#0D7377]/10 text-[#0D7377] font-semibold'
                                : 'text-[#1E293B] hover:bg-[#F8FAFC]'
                                }`}
                        >
                            <span>{option}</span>
                            {value === option && <Check size={16} className="text-[#0D7377]" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export function CreateMealPlanForm() {
    const router = useRouter()

    // Form State
    const [planName, setPlanName] = useState('')
    const [description, setDescription] = useState('')
    const [dietaryPreference, setDietaryPreference] = useState('')
    const [enablePlan, setEnablePlan] = useState(true)
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Dynamic meals price dictionary
    const [mealPrices, setMealPrices] = useState<Record<string, number>>(DEFAULT_MEAL_PRICES)
    const [breakfastOptions, setBreakfastOptions] = useState<string[]>(DEFAULT_BREAKFAST_OPTIONS)
    const [lunchOptions, setLunchOptions] = useState<string[]>(DEFAULT_LUNCH_OPTIONS)
    const [dinnerOptions, setDinnerOptions] = useState<string[]>(DEFAULT_DINNER_OPTIONS)
    const [allMeals, setAllMeals] = useState<any[]>([])

    // Daily Meal Selections State
    const [dailyMeals, setDailyMeals] = useState<Record<string, DayPlan>>(EMPTY_WEEK)

    // Load available meals on mount to populate prices and options
    useEffect(() => {
        getMeals().then((meals) => {
            if (meals && meals.length > 0) {
                setAllMeals(meals)
                const prices: Record<string, number> = { ...DEFAULT_MEAL_PRICES }
                const bOpts = new Set<string>(DEFAULT_BREAKFAST_OPTIONS)
                const lOpts = new Set<string>(DEFAULT_LUNCH_OPTIONS)
                const dOpts = new Set<string>(DEFAULT_DINNER_OPTIONS)

                meals.forEach((m) => {
                    prices[m.name] = m.price
                    bOpts.add(m.name)
                    lOpts.add(m.name)
                    dOpts.add(m.name)
                })

                setMealPrices(prices)
                setBreakfastOptions(Array.from(bOpts))
                setLunchOptions(Array.from(lOpts))
                setDinnerOptions(Array.from(dOpts))
            }
        }).catch((err) => {
            console.warn('Using default meal prices:', err)
        })
    }, [])

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
            if (dayPlan.breakfast && mealPrices[dayPlan.breakfast]) {
                total += mealPrices[dayPlan.breakfast]
            }
            if (dayPlan.lunch && mealPrices[dayPlan.lunch]) {
                total += mealPrices[dayPlan.lunch]
            }
            if (dayPlan.dinner && mealPrices[dayPlan.dinner]) {
                total += mealPrices[dayPlan.dinner]
            }
        })
        return total
    }, [dailyMeals, mealPrices])

    // Show Toast helper
    const triggerToast = (msg: string) => {
        setToastMessage(msg)
        setTimeout(() => {
            setToastMessage(null)
        }, 3500)
    }

    // Action handlers
    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!planName.trim()) {
            triggerToast('Please provide a Plan Name.')
            return
        }

        setIsSaving(true)
        try {
            const foodItemsPayload: { food_item_id: number; day: string; meal_type: string }[] = []
            
            Object.entries(dailyMeals).forEach(([day, dayPlan]) => {
                if (dayPlan.breakfast) {
                    const found = allMeals.find(m => m.name === dayPlan.breakfast)
                    if (found) {
                        foodItemsPayload.push({
                            food_item_id: found.id,
                            day,
                            meal_type: 'Breakfast'
                        })
                    }
                }
                if (dayPlan.lunch) {
                    const found = allMeals.find(m => m.name === dayPlan.lunch)
                    if (found) {
                        foodItemsPayload.push({
                            food_item_id: found.id,
                            day,
                            meal_type: 'Lunch'
                        })
                    }
                }
                if (dayPlan.dinner) {
                    const found = allMeals.find(m => m.name === dayPlan.dinner)
                    if (found) {
                        foodItemsPayload.push({
                            food_item_id: found.id,
                            day,
                            meal_type: 'Dinner'
                        })
                    }
                }
            })

            await createMealPlan({
                name: planName,
                category: 'General',
                description: description || 'No description provided.',
                dietary_preference: dietaryPreference || 'General',
                price: calculatedTotalPrice,
                is_available: enablePlan,
                food_items: foodItemsPayload,
            })

            triggerToast('Meal plan saved successfully!')
            setTimeout(() => {
                router.push('/meal-plans')
            }, 1000)
        } catch (err: any) {
            triggerToast(err.message || 'Failed to save meal plan.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setPlanName('')
        setDescription('')
        setDietaryPreference('')
        setEnablePlan(false)
        setDailyMeals(EMPTY_WEEK)
        router.push('/meal-plans')
    }

    return (
        <div className="w-full max-w-6xl mx-auto py-2 px-2 sm:px-4 space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0D7377] text-white px-4 py-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <Check size={18} />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Top Header Bar */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
                    Create Meal Plan
                </h1>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-semibold text-[#0D7377] hover:text-[#0A5C60] hover:underline transition-colors cursor-pointer bg-transparent border-0"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSavePlan}
                        className="px-5 py-2.5 bg-[#0D7377] hover:bg-[#0A5C60] text-white text-sm font-semibold rounded-lg shadow-xs transition-all cursor-pointer border-0 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Plan'
                        )}
                    </button>
                </div>
            </div>

            {/* Main Off-White Form Card */}
            <div className="bg-[#FAF8F5] border border-[#EAE4D9] rounded-2xl p-6 sm:p-8 shadow-2xs">
                <form onSubmit={handleSavePlan} className="space-y-6">
                    {/* Plan Name & Description Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-[#334155] mb-2">
                                Plan Name
                            </label>
                            <input
                                type="text"
                                value={planName}
                                onChange={(e) => setPlanName(e.target.value)}
                                placeholder="e.g. Standard Office Week"
                                className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:border-transparent transition-all shadow-2xs"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#334155] mb-2">
                                Description
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of the plan"
                                className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:border-transparent transition-all shadow-2xs"
                            />
                        </div>
                    </div>

                    {/* Dietary Preference Dropdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-[#334155] mb-2">
                                Dietary Preference
                            </label>
                            <CustomSelect
                                value={dietaryPreference}
                                placeholder="Select Dietary Preference Type"
                                options={DIETARY_OPTIONS}
                                onChange={setDietaryPreference}
                            />
                        </div>
                    </div>

                    {/* Daily Configuration Section */}
                    <div className="pt-2">
                        <h2 className="text-base font-bold text-[#1E293B] mb-4">
                            Daily Configuration
                        </h2>

                        <div className="space-y-3">
                            {DAYS_OF_WEEK.map((day) => (
                                <div
                                    key={day}
                                    className="bg-[#F5F0E6] rounded-xl px-5 py-3.5 flex flex-row items-center gap-4 transition-colors"
                                >
                                    {/* Day Label */}
                                    <div className="w-28 shrink-0 font-bold text-[#1E293B] text-sm">
                                        {day}
                                    </div>

                                    {/* 3 Meal Custom Dropdown Selects in 1 horizontal row */}
                                    <div className="grid grid-cols-3 gap-4 flex-1">
                                        {/* Breakfast Select */}
                                        <CustomSelect
                                            value={dailyMeals[day].breakfast}
                                            placeholder="Select Breakfast..."
                                            options={breakfastOptions}
                                            onChange={(val) => handleMealChange(day, 'breakfast', val)}
                                        />

                                        {/* Lunch Select */}
                                        <CustomSelect
                                            value={dailyMeals[day].lunch}
                                            placeholder="Select Lunch..."
                                            options={lunchOptions}
                                            onChange={(val) => handleMealChange(day, 'lunch', val)}
                                        />

                                        {/* Dinner Select */}
                                        <CustomSelect
                                            value={dailyMeals[day].dinner}
                                            placeholder="Select Dinner..."
                                            options={dinnerOptions}
                                            onChange={(val) => handleMealChange(day, 'dinner', val)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer controls: Enable Plan & Calculated Total Price */}
                    <div className="pt-6 border-t border-[#EAE4D9] flex flex-row items-center justify-between gap-4">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={enablePlan}
                                onChange={(e) => setEnablePlan(e.target.checked)}
                                className="w-4 h-4 rounded border-[#CBD5E1] text-[#0D7377] accent-[#0D7377] focus:ring-[#0D7377] cursor-pointer"
                            />
                            <span className="text-sm font-semibold text-[#334155]">
                                Enable Plan
                            </span>
                        </label>

                        <div className="text-right">
                            <div className="text-xs font-semibold text-[#64748B] mb-0.5">
                                Calculated Total Price
                            </div>
                            <div className="text-2xl font-bold text-[#0D7377] tracking-tight">
                                Rs. {calculatedTotalPrice.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
