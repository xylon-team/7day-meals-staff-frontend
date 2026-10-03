'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { Supplier, CreateSupplierDto } from '@/lib/types/supplier'
import { createSupplier, updateSupplier } from '@/lib/api/supplier'

interface CreateSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (supplier: Supplier, message: string) => void
  editingSupplier?: Supplier | null
}

interface FormErrors {
  name?: string
  contactPerson?: string
  email?: string
  phone?: string
}

export function CreateSupplierModal({
  isOpen,
  onClose,
  onSuccess,
  editingSupplier,
}: CreateSupplierModalProps) {
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Populate form fields if editing existing supplier, or reset for new
  useEffect(() => {
    if (editingSupplier) {
      setName(editingSupplier.name || '')
      setContactPerson(editingSupplier.contactPerson || '')
      setEmail(editingSupplier.email || '')
      setPhone(editingSupplier.phone || '')
      setAddress(editingSupplier.address || editingSupplier.address_line_1 || '')
      setIsActive(editingSupplier.isActive !== false)
    } else {
      setName('')
      setContactPerson('')
      setEmail('')
      setPhone('')
      setAddress('')
      setIsActive(true)
    }
    setErrors({})
    setApiError(null)
  }, [editingSupplier, isOpen])

  if (!isOpen) return null

  // Validate form fields matching real database requirements
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!name.trim()) {
      newErrors.name = 'Supplier Name is required'
    }

    if (!contactPerson.trim()) {
      newErrors.contactPerson = 'Contact Person is required'
    }

    if (!email.trim()) {
      newErrors.email = 'Email Address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone Number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (!validateForm()) return

    const dto: CreateSupplierDto = {
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      isActive: isActive,
      address: address.trim() || undefined,
      address_line_1: address.trim() || undefined,
    }

    setSubmitting(true)
    try {
      if (editingSupplier) {
        const updated = await updateSupplier(editingSupplier.id, dto)
        onSuccess(updated, `Supplier "${name.trim()}" updated successfully!`)
      } else {
        const created = await createSupplier(dto)
        onSuccess(created, `Supplier "${name.trim()}" created successfully!`)
      }
      onClose()
    } catch (err: any) {
      console.error('Failed to submit supplier:', err)
      setApiError(
        err.message || 'An error occurred while saving the supplier. Please check your input and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[540px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-gray-900 transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md focus:outline-none"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* API Error Alert Banner */}
          {apiError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-700 text-xs sm:text-sm font-medium animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Supplier Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              placeholder=""
              className={`w-full h-11 px-3.5 rounded-lg border bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] transition-all ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Contact Person & Email Address Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => {
                  setContactPerson(e.target.value)
                  if (errors.contactPerson)
                    setErrors((prev) => ({ ...prev, contactPerson: undefined }))
                }}
                placeholder=""
                className={`w-full h-11 px-3.5 rounded-lg border bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] transition-all ${
                  errors.contactPerson ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                }`}
              />
              {errors.contactPerson && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.contactPerson}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                placeholder=""
                className={`w-full h-11 px-3.5 rounded-lg border bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] transition-all ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
              }}
              placeholder=""
              className={`w-full h-11 px-3.5 rounded-lg border bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] transition-all ${
                errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Address
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder=""
              className="w-full p-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] transition-all resize-none"
            />
          </div>

          {/* Active Supplier Checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="activeSupplier"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0D7377] focus:ring-[#0D7377] cursor-pointer accent-[#0D7377]"
            />
            <label
              htmlFor="activeSupplier"
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              Active Supplier
            </label>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-[#0D7377] hover:bg-[#0D7377]/10 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0D7377] hover:bg-[#0A5C60] active:bg-[#084B4E] rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>{submitting ? 'Saving...' : 'Save Supplier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateSupplierModal
