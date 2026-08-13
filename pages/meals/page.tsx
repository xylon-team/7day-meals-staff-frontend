'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  SlidersHorizontal,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react'
import { useUserStore } from '@/store/user-store'
import { usePermission } from '@/lib/use-permission'
import { getMeals, createMeal, updateMeal, deleteMeal } from '@/lib/api/meals'
import { Meal } from '@/lib/types/meals'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card, CardContent } from '@/components/Card'
import { Input } from '@/components/Input'
import { cn } from '@/lib/utils'

export function Meals() {
  const router = useRouter()
  const { user } = useUserStore()

  // Permissions check
  const canView = usePermission('meal_item', 'view')
  const canAdd = usePermission('meal_item', 'add')
  const canChange = usePermission('meal_item', 'change')
  const canDelete = usePermission('meal_item', 'delete')

  // Redirection guard
  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (!canView) {
      router.push('/dashboard')
    }
  }, [user, canView, router])

  // Component States
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Filters States
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false)
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  // Temp Filters States (for popover changes)
  const [tempAvailabilityFilter, setTempAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [tempMinPrice, setTempMinPrice] = useState('')
  const [tempMaxPrice, setTempMaxPrice] = useState('')

  const filterPopoverRef = React.useRef<HTMLDivElement>(null)
  const filterButtonRef = React.useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isFilterPopoverOpen &&
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsFilterPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFilterPopoverOpen])

  // Edit / Add Modal States
  const [isMealModalOpen, setIsMealModalOpen] = useState(false)
  const [mealEditing, setMealEditing] = useState<Meal | null>(null)
  const [mealName, setMealName] = useState('')
  const [mealIngredients, setMealIngredients] = useState('')
  const [mealPrice, setMealPrice] = useState('')
  const [mealIsVeg, setMealIsVeg] = useState(false)
  const [mealIsAvailable, setMealIsAvailable] = useState(true)
  const [mealImage, setMealImage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }, [])

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMealImage(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const fetchMeals = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMeals()
      setMeals(data)
    } catch (err) {
      console.error('Error fetching meals:', err)
      showToast('Failed to load meals.')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // Fetch meals on load
  useEffect(() => {
    if (user && canView) {
      Promise.resolve().then(() => {
        fetchMeals()
      })
    }
  }, [user, canView, fetchMeals])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!mealName.trim()) {
      newErrors.name = 'Meal name is required.'
    }
    if (!mealIngredients.trim()) {
      newErrors.ingredients = 'Ingredients are required.'
    }
    if (!mealPrice || isNaN(Number(mealPrice)) || Number(mealPrice) <= 0) {
      newErrors.price = 'Price must be a positive number.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const mealDto = {
      name: mealName.trim(),
      ingredients: mealIngredients.trim(),
      price: Math.round(Number(mealPrice)),
      is_available: mealIsAvailable,
      is_veg: mealIsVeg,
      image_url: mealImage.trim() || undefined,
    }

    try {
      if (mealEditing) {
        await updateMeal(mealEditing.id, mealDto)
        showToast(`Meal "${mealDto.name}" updated successfully!`)
      } else {
        await createMeal(mealDto)
        showToast(`Meal "${mealDto.name}" created successfully!`)
      }
      await fetchMeals()
      setIsMealModalOpen(false)
    } catch (err) {
      console.error(err)
      showToast('Failed to save meal.')
    }
  }

  const handleDeleteMeal = async (id: number) => {
    const targetMeal = meals.find((m) => m.id === id)
    const mealLabel = targetMeal ? targetMeal.name : 'Meal'
    try {
      await deleteMeal(id)
      showToast(`Meal "${mealLabel}" deleted.`)
      setDeleteConfirm(null)
      await fetchMeals()
    } catch (err) {
      console.error(err)
      showToast('Failed to delete meal.')
    }
  }

  const handleToggleAvailability = async (id: number, currentStatus: boolean, name: string) => {
    try {
      const newStatus = !currentStatus
      await updateMeal(id, { is_available: newStatus })
      showToast(`"${name}" is now ${newStatus ? 'Available' : 'Unavailable'}.`)
      await fetchMeals()
    } catch (err) {
      console.error(err)
      showToast('Failed to change availability.')
    }
  }

  const openMealModal = (meal: Meal | null = null) => {
    setErrors({})
    if (meal) {
      setMealEditing(meal)
      setMealName(meal.name)
      setMealIngredients(meal.ingredients)
      setMealPrice(meal.price.toString())
      setMealIsVeg(!!meal.is_veg)
      setMealIsAvailable(meal.is_available)
      setMealImage(meal.image_url || '')
    } else {
      setMealEditing(null)
      setMealName('')
      setMealIngredients('')
      setMealPrice('')
      setMealIsVeg(false)
      setMealIsAvailable(true)
      setMealImage('')
    }
    setIsMealModalOpen(true)
  }

  // Dynamic filter logic
  const filteredMeals = meals.filter((meal) => {
    const matchesSearch =
      meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.ingredients.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Availability Filter
    let matchesAvailability = true
    if (availabilityFilter === 'available') {
      matchesAvailability = meal.is_available === true
    } else if (availabilityFilter === 'unavailable') {
      matchesAvailability = meal.is_available === false
    }

    // Price Filter
    let matchesPrice = true
    const priceVal = meal.price
    if (minPrice !== '') {
      matchesPrice = matchesPrice && priceVal >= Number(minPrice)
    }
    if (maxPrice !== '') {
      matchesPrice = matchesPrice && priceVal <= Number(maxPrice)
    }

    return matchesSearch && matchesAvailability && matchesPrice
  })

  // Avoid loading screen / flash if unauthorized
  if (!user || !canView) return null

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#0d7377] text-white px-4 py-3 rounded-card shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check size={18} />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-ink-soft mb-2">
          <span className="cursor-pointer hover:underline" onClick={() => router.push('/dashboard')}>
            Dashboard
          </span>
          <span>/</span>
          <span className="text-ink font-medium">Meals</span>
        </nav>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-ink">Meal Management</h2>
          {canAdd && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openMealModal()}
              className="flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Add Meal
            </Button>
          )}
        </div>
      </div>

      {/* Card Wrapper for table */}
      <Card>
        {/* Card Header (Search & filter) */}
        <div className="p-4 border-b border-line bg-card flex items-center justify-between gap-4 relative">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meals..."
              className="h-10 pl-10 pr-4 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full transition-all text-ink placeholder:text-ink-soft"
            />
          </div>
          <button
            ref={filterButtonRef}
            onClick={() => {
              if (!isFilterPopoverOpen) {
                setTempAvailabilityFilter(availabilityFilter)
                setTempMinPrice(minPrice)
                setTempMaxPrice(maxPrice)
              }
              setIsFilterPopoverOpen(!isFilterPopoverOpen)
            }}
            className={cn(
              'h-10 w-10 flex items-center justify-center rounded-control border transition-all cursor-pointer shrink-0',
              isFilterPopoverOpen || availabilityFilter !== 'all' || minPrice !== '' || maxPrice !== ''
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-line text-ink-soft hover:bg-canvas'
            )}
            title="Filters"
          >
            <SlidersHorizontal size={18} />
          </button>

          {/* Filters Popover Dropdown */}
          {isFilterPopoverOpen && (
            <div
              ref={filterPopoverRef}
              className="absolute right-4 top-[56px] z-30 w-[280px] border border-line bg-[#fffdf9] rounded-[12px] shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[17px] font-bold text-ink">Filters</span>
                <button
                  type="button"
                  onClick={() => {
                    setTempAvailabilityFilter('all')
                    setTempMinPrice('')
                    setTempMaxPrice('')
                    setAvailabilityFilter('all')
                    setMinPrice('')
                    setMaxPrice('')
                    setIsFilterPopoverOpen(false)
                  }}
                  className="text-sm font-semibold text-[#0d7377] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Availability Filter Section */}
              <div className="space-y-3 mb-5">
                <span className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider">Availability</span>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group text-sm font-medium text-ink">
                    <input
                      type="radio"
                      name="availability"
                      checked={tempAvailabilityFilter === 'all'}
                      onChange={() => setTempAvailabilityFilter('all')}
                      className="h-4.5 w-4.5 accent-[#0d7377] cursor-pointer"
                    />
                    <span>All</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group text-sm font-medium text-ink">
                    <input
                      type="radio"
                      name="availability"
                      checked={tempAvailabilityFilter === 'available'}
                      onChange={() => setTempAvailabilityFilter('available')}
                      className="h-4.5 w-4.5 accent-[#0d7377] cursor-pointer"
                    />
                    <span>Available</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group text-sm font-medium text-ink">
                    <input
                      type="radio"
                      name="availability"
                      checked={tempAvailabilityFilter === 'unavailable'}
                      onChange={() => setTempAvailabilityFilter('unavailable')}
                      className="h-4.5 w-4.5 accent-[#0d7377] cursor-pointer"
                    />
                    <span>Unavailable</span>
                  </label>
                </div>
              </div>

              {/* Price Range Section */}
              <div className="space-y-3 mb-6">
                <span className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider">Price Range</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Rs. Min"
                      value={tempMinPrice}
                      onChange={(e) => setTempMinPrice(e.target.value)}
                      className="h-10 w-full px-3 border border-line rounded-control bg-white text-sm text-ink placeholder:text-ink-soft/75 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <span className="text-ink-soft/60 font-semibold">—</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Rs. Max"
                      value={tempMaxPrice}
                      onChange={(e) => setTempMaxPrice(e.target.value)}
                      className="h-10 w-full px-3 border border-line rounded-control bg-white text-sm text-ink placeholder:text-ink-soft/75 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={() => {
                  setAvailabilityFilter(tempAvailabilityFilter)
                  setMinPrice(tempMinPrice)
                  setMaxPrice(tempMaxPrice)
                  setIsFilterPopoverOpen(false)
                }}
                className="w-full h-10 bg-[#0d7377] hover:bg-[#0a5c60] text-white text-sm font-semibold rounded-control transition-all shadow-sm cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-ink-soft">
            <Loader2 className="animate-spin text-primary" size={24} />
            <span className="text-sm font-medium">Loading meal items...</span>
          </div>
        ) : (
          /* Table Layout */
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-line text-ink-soft text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 w-[280px]">Meal Name</th>
                  <th className="px-6 py-4">Ingredients</th>
                  <th className="px-6 py-4 w-[110px]">Price</th>
                  <th className="px-6 py-4 text-center w-[130px]">Availability</th>
                  <th className="px-6 py-4 text-right w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-card">
                {filteredMeals.length > 0 ? (
                  filteredMeals.map((meal) => (
                    <tr key={meal.id} className="hover:bg-canvas/30 transition-colors">
                      {/* Name with Image Thumbnail */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-canvas border border-line flex items-center justify-center text-ink-soft shrink-0 overflow-hidden">
                            {meal.image_url ? (
                              <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={18} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-ink text-sm leading-tight">{meal.name}</span>
                            {meal.is_veg && (
                              <Badge
                                variant="success"
                                className="mt-1 w-fit px-1.5 py-0 text-[9px] font-extrabold tracking-wider uppercase rounded"
                              >
                                VEG
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Ingredients */}
                      <td className="px-6 py-4 text-ink-soft text-sm max-w-[200px] md:max-w-xs lg:max-w-md truncate" title={meal.ingredients}>
                        {meal.ingredients}
                      </td>

                      {/* Price (Stacked) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold text-ink-soft leading-none">Rs.</span>
                          <span className="text-sm font-bold text-ink mt-0.5">{meal.price}</span>
                        </div>
                      </td>

                      {/* Availability Switch */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center">
                          <button
                            disabled={!canChange}
                            onClick={() => handleToggleAvailability(meal.id, meal.is_available, meal.name)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              meal.is_available ? 'bg-primary-light' : 'bg-line'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                meal.is_available ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-ink-soft">
                        <div className="flex items-center justify-end gap-4">
                          {canChange && (
                            <button
                              onClick={() => router.push(`/meals/edit-meals?id=${meal.id}`)}
                              className="hover:text-ink transition-colors cursor-pointer"
                              title="Edit Meal"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirm(meal.id)}
                              className="text-danger-fg hover:text-danger-fg/80 transition-colors cursor-pointer"
                              title="Delete Meal"
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
                    <td colSpan={5} className="px-6 py-8 text-center text-ink-soft">
                      No meals found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ==================== CREATE / EDIT MEAL MODAL ==================== */}
      {isMealModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-[480px] shadow-2xl border border-line bg-card overflow-hidden animate-in zoom-in-95 duration-200 rounded-[12px]">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-card">
              <h3 className="text-[17px] font-bold text-ink">{mealEditing ? 'Edit Meal' : 'Add Meal'}</h3>
              <button onClick={() => setIsMealModalOpen(false)} className="text-ink-soft hover:text-ink cursor-pointer transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMealSubmit}>
              <CardContent className="p-6 space-y-5">
                {/* Meal Name & Price (Side by Side) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Meal Name</label>
                    <Input
                      type="text"
                      value={mealName}
                      onChange={(e) => {
                        setMealName(e.target.value)
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                      }}
                      placeholder="e.g. Chicken Fried Rice"
                      className="bg-white"
                      error={errors.name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Price (Rs.)</label>
                    <Input
                      type="number"
                      value={mealPrice}
                      onChange={(e) => {
                        setMealPrice(e.target.value)
                        if (errors.price) setErrors((prev) => ({ ...prev, price: '' }))
                      }}
                      placeholder="e.g. 850"
                      className="bg-white"
                      error={errors.price}
                    />
                  </div>
                </div>

                {/* Ingredient List */}
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Ingredient List</label>
                  <textarea
                    value={mealIngredients}
                    onChange={(e) => {
                      setMealIngredients(e.target.value)
                      if (errors.ingredients) setErrors((prev) => ({ ...prev, ingredients: '' }))
                    }}
                    placeholder="e.g. Rice, Chicken, Eggs, Soy Sauce, Green Onions"
                    className={cn(
                      'w-full h-20 p-3 border border-line rounded-control bg-white text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none',
                      errors.ingredients && 'border-danger-fg focus:ring-danger-fg'
                    )}
                  />
                  {errors.ingredients && <p className="mt-1 text-xs text-danger-fg">{errors.ingredients}</p>}
                </div>

                {/* Image Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Image</label>
                  {mealImage ? (
                    <div className="relative w-full h-[140px] rounded-control border border-line bg-canvas/30 overflow-hidden group">
                      <img src={mealImage} alt="Meal Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-opacity duration-200">
                        <button
                          type="button"
                          onClick={handleImageClick}
                          className="px-3 py-1.5 bg-white text-ink text-xs font-semibold rounded shadow hover:bg-white/90 cursor-pointer"
                        >
                          Change Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setMealImage('')}
                          className="px-3 py-1.5 bg-[#9f1239] text-white text-xs font-semibold rounded shadow hover:bg-[#9f1239]/90 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={handleImageClick}
                      className="w-full h-[140px] border border-dashed border-[#e8e4de] rounded-control bg-white hover:bg-canvas/30 transition-all p-6 flex flex-col items-center justify-center gap-2 cursor-pointer group"
                    >
                      <ImageIcon size={32} className="text-ink-soft/70 group-hover:text-ink transition-colors" />
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-[#1a1a2e]">Click to upload image</span>
                        <span className="text-xs text-ink-soft/80 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</span>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </CardContent>
              <div className="px-6 py-4 border-t border-line flex justify-end items-center gap-3 bg-card">
                <button
                  type="button"
                  onClick={() => setIsMealModalOpen(false)}
                  className="text-sm font-semibold text-[#0d7377] hover:text-[#0a5c60] hover:underline cursor-pointer bg-transparent border-0 outline-none px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#0d7377] hover:bg-[#0a5c60] text-white text-sm font-semibold rounded-control transition-all shadow-sm cursor-pointer"
                >
                  Save Meal
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl border border-line bg-card overflow-hidden animate-in zoom-in-95 duration-200 rounded-xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-ink mb-2">Delete Meal Item?</h3>
              <p className="text-sm text-ink-soft mb-6">
                Are you sure you want to delete this meal item? This action is permanent and cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteMeal(deleteConfirm)}>
                  Delete Meal
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Meals
