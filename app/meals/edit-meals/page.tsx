'use client'

import React, { useState, useRef } from 'react'
import { X, Image as ImageIcon, Check, Loader2, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface MealFormData {
    name: string
    price: string
    type: string
    imageUrl: string
    availableForOrders: boolean
    isVegetarian: boolean
}

interface EditMealModalProps {
    initialData?: Partial<MealFormData>
    onSave?: (data: MealFormData) => Promise<void> | void
    onCancel?: () => void
    isOpen?: boolean
}

export function EditMealModal({
    initialData = {},
    onSave,
    onCancel,
    isOpen = true,
}: EditMealModalProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState<MealFormData>({
        name: initialData.name || '',
        price: initialData.price || '',
        type: initialData.type || '',
        imageUrl: initialData.imageUrl || '',
        availableForOrders: initialData.availableForOrders ?? true,
        isVegetarian: initialData.isVegetarian ?? false,
    })

    const [imagePreview, setImagePreview] = useState<string>(
        initialData.imageUrl || ''
    )
    const [isDragging, setIsDragging] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [savedSuccess, setSavedSuccess] = useState(false)

    if (!isOpen) return null

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const handleCheckboxChange = (name: keyof MealFormData) => {
        setFormData((prev) => ({ ...prev, [name]: !prev[name] }))
    }

    const handleFileSelected = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setErrors((prev) => ({
                ...prev,
                image: 'Please select a valid image file (SVG, PNG, JPG, or GIF).',
            }))
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors((prev) => ({
                ...prev,
                image: 'File size exceeds 5MB limit.',
            }))
            return
        }

        setErrors((prev) => ({ ...prev, image: '' }))

        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            setImagePreview(result)
            setFormData((prev) => ({ ...prev, imageUrl: result }))
        }
        reader.readAsDataURL(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelected(e.dataTransfer.files[0])
        }
    }

    const handleRemoveImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setImagePreview('')
        setFormData((prev) => ({ ...prev, imageUrl: '' }))
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Meal name is required'
        }

        if (!formData.price.trim()) {
            newErrors.price = 'Price is required'
        } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
            newErrors.price = 'Please enter a valid price'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setIsSubmitting(true)
        try {
            if (onSave) {
                await onSave(formData)
            }
            setSavedSuccess(true)
            setTimeout(() => {
                setSavedSuccess(false)
                if (onCancel) {
                    onCancel()
                } else {
                    router.back()
                }
            }, 1200)
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        if (onCancel) {
            onCancel()
        } else {
            router.back()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Modal Container */}
            <div
                className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-[#fdfcfb] shadow-2xl transition-all border border-[#e8e4de]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-meal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#eee9e5] px-6 py-5 bg-[#fdfcfb]">
                    <h2
                        id="edit-meal-title"
                        className="text-xl font-bold text-[#1a1a2e] tracking-tight"
                    >
                        Edit Meal
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors focus:outline-none"
                        aria-label="Close dialog"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 px-6 py-6 bg-[#fdfcfb]">
                        {/* Top Row: Meal Name & Price */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Meal Name Field */}
                            <div>
                                <label
                                    htmlFor="meal-name"
                                    className="block text-sm font-semibold text-[#1a1a2e] mb-1.5"
                                >
                                    Meal Name
                                </label>
                                <input
                                    id="meal-name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`h-11 w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#1a1a2e] transition-all focus:outline-none focus:ring-2 ${errors.name
                                            ? 'border-red-500 focus:ring-red-400'
                                            : 'border-[#e8e4de] focus:border-transparent focus:ring-[#0d7377]'
                                        }`}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Price (Rs.) Field */}
                            <div>
                                <label
                                    htmlFor="meal-price"
                                    className="block text-sm font-semibold text-[#1a1a2e] mb-1.5"
                                >
                                    Price (Rs.)
                                </label>
                                <input
                                    id="meal-price"
                                    type="text"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`h-11 w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#1a1a2e] transition-all focus:outline-none focus:ring-2 ${errors.price
                                            ? 'border-red-500 focus:ring-red-400'
                                            : 'border-[#e8e4de] focus:border-transparent focus:ring-[#0d7377]'
                                        }`}
                                />
                                {errors.price && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">
                                        {errors.price}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Meal Type Field */}
                        <div>
                            <label
                                htmlFor="meal-type"
                                className="block text-sm font-semibold text-[#1a1a2e] mb-1.5"
                            >
                                Meal Type
                            </label>
                            <input
                                id="meal-type"
                                type="text"
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                placeholder=""
                                className="h-11 w-full rounded-lg border border-[#e8e4de] bg-white px-3.5 py-2 text-sm text-[#1a1a2e] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0d7377]"
                            />
                        </div>

                        {/* Image Upload Zone */}
                        <div>
                            <label className="block text-sm font-semibold text-[#1a1a2e] mb-1.5">
                                Image
                            </label>

                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFileSelected(e.target.files[0])
                                    }
                                }}
                            />

                            {/* Drag & Drop Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border p-6 text-center transition-all ${isDragging
                                        ? 'border-[#0d7377] bg-[#0d7377]/5'
                                        : 'border-[#e4dfd7] bg-[#f7f4ef] hover:bg-[#f3efe8]'
                                    }`}
                            >
                                {imagePreview ? (
                                    <div className="relative group w-full flex flex-col items-center justify-center">
                                        <img
                                            src={imagePreview}
                                            alt="Meal Preview"
                                            className="max-h-[120px] rounded-lg object-contain shadow-xs"
                                        />
                                        <div className="mt-3 flex items-center gap-3">
                                            <span className="text-xs font-semibold text-[#0d7377] hover:underline">
                                                Change image
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="text-xs font-semibold text-red-600 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-1.5 text-[#4a5568]">
                                            <ImageIcon className="h-9.5 w-9.5 stroke-[1.5]" />
                                        </div>
                                        <p className="text-[15px] font-semibold text-[#1a1a2e]">
                                            Click to upload image
                                        </p>
                                        <p className="mt-0.5 text-xs text-[#71717a]">
                                            SVG, PNG, JPG or GIF (max. 800x400px)
                                        </p>
                                    </>
                                )}
                            </div>
                            {errors.image && (
                                <p className="mt-1 text-xs text-red-500 font-medium">
                                    {errors.image}
                                </p>
                            )}
                        </div>

                        {/* Checkboxes Row */}
                        <div className="flex flex-wrap items-center gap-6 pt-1">
                            {/* Available for orders Checkbox */}
                            <label
                                onClick={() => handleCheckboxChange('availableForOrders')}
                                className="flex items-center gap-2.5 cursor-pointer group select-none"
                            >
                                <div
                                    className={`flex h-5 w-5 items-center justify-center rounded-[4px] border-2 transition-all bg-white border-[#0d7377]`}
                                >
                                    {formData.availableForOrders && (
                                        <Check className="h-3.5 w-3.5 stroke-[3] text-[#0d7377]" />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-[#1a1a2e]">
                                    Available for orders
                                </span>
                            </label>

                            {/* Vegetarian Checkbox */}
                            <label
                                onClick={() => handleCheckboxChange('isVegetarian')}
                                className="flex items-center gap-2.5 cursor-pointer group select-none"
                            >
                                <div
                                    className={`flex h-5 w-5 items-center justify-center rounded-[4px] border-2 transition-all bg-white border-[#0d7377]`}
                                >
                                    {formData.isVegetarian && (
                                        <Check className="h-3.5 w-3.5 stroke-[3] text-[#0d7377]" />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-[#1a1a2e]">
                                    Vegetarian
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Success Banner */}
                    {savedSuccess && (
                        <div className="mx-6 mb-2 rounded-lg bg-teal-50 p-3 text-center text-sm font-medium text-[#0d7377] flex items-center justify-center gap-2">
                            <Check className="h-4 w-4" /> Meal updated successfully!
                        </div>
                    )}

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-5 px-6 py-4.5 border-t border-[#eee9e5] bg-[#fdfcfb]">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-sm font-semibold text-[#0d7377] hover:underline cursor-pointer bg-transparent border-0 outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2 h-10 px-5 bg-[#0d7377] hover:bg-[#0a5c60] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Meal'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function EditMealPage() {
    return (
        <div className="min-h-screen bg-[#f7f4ef] p-4 flex items-center justify-center">
            <EditMealModal />
        </div>
    )
}
