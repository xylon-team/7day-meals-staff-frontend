'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Truck,
  Phone,
  Search,
  Plus,
  Edit2,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import {
  getSuppliers,
  toggleSupplierStatus,
  createSupplier,
  updateSupplier,
} from '@/lib/api/supplier'
import { Supplier, CreateSupplierDto } from '@/lib/types/supplier'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { CreateSupplierModal } from '@/components/CreateSupplierModal'
import { usePermission } from '@/lib/use-permission'
import { cn } from '@/lib/utils'

export function SuppliersPage() {
  const router = useRouter()
  const canAdd = usePermission('supplier', 'add')
  const canChange = usePermission('supplier', 'change')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSupplierList(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchSupplierList = async (search?: string) => {
    setLoading(true)
    try {
      const data = await getSuppliers(search)
      setSuppliers(data)
    } catch (err) {
      console.error('Failed to load suppliers:', err)
      showToast('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // Toggle supplier status
  const handleToggleStatus = async (supplier: Supplier) => {
    const newStatus = !supplier.isActive
    setActionLoadingId(supplier.id)

    // Optimistic UI update
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplier.id ? { ...s, isActive: newStatus } : s))
    )

    try {
      const updated = await toggleSupplierStatus(supplier.id, newStatus, supplier)
      setSuppliers((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      )
      showToast(
        newStatus
          ? `${supplier.name} activated successfully`
          : `${supplier.name} deactivated successfully`
      )
    } catch (err) {
      console.error('Failed to toggle status:', err)
      // Revert optimistic update
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? { ...s, isActive: !newStatus } : s))
      )
      showToast('Failed to update status')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Open modal for Create or Edit
  const openAddModal = () => {
    setEditingSupplier(null)
    setIsModalOpen(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsModalOpen(true)
  }

  // Extract all unique categories for the dropdown filter
  const allCategories = Array.from(
    new Set(suppliers.flatMap((s) => s.categories))
  ).filter(Boolean)

  // Filter suppliers by search query and category
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim()
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      (s.address && s.address.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
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
          <span
            className="cursor-pointer hover:underline"
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </span>
          <span>/</span>
          <span className="text-ink font-medium">Suppliers</span>
        </nav>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-ink tracking-tight">Suppliers</h2>
          {canAdd && (
            <Button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-[#0d7377] hover:bg-[#0a5c60] text-white font-medium px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              <Plus size={18} />
              <span>Add Supplier</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search Card */}
      <Card className="p-5 sm:p-6 space-y-6 bg-white border border-line shadow-card">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suppliers..."
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#f4f2ee] border-transparent text-sm text-ink placeholder:text-ink-soft/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-[#ecf7f7] border-b border-line text-[#4a6b6c] text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Supplier Name</th>
                <th className="px-6 py-4 font-semibold">Contact Person</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Address</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-card">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-soft">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm">Loading suppliers...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-soft">
                    <p className="text-base font-medium text-ink">No suppliers found</p>
                    <p className="text-xs text-ink-soft mt-1">
                      {searchQuery
                        ? `No results matching "${searchQuery}"`
                        : 'No supplier records available'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-canvas/30 transition-colors"
                  >
                    {/* Supplier Name */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <Truck size={17} className="text-[#0d7377] shrink-0" />
                        <span className="font-semibold text-ink text-sm sm:text-base">
                          {supplier.name}
                        </span>
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-ink font-medium">
                      {supplier.contactPerson}
                    </td>

                    {/* Contact Info (Email & Phone) */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-ink-soft">
                          {supplier.email}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-ink-soft/90 mt-0.5">
                          <Phone size={12} className="text-ink-soft shrink-0" />
                          <span>{supplier.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="px-6 py-5 max-w-xs truncate text-sm text-ink-soft">
                      {supplier.address || '—'}
                    </td>

                    {/* Status Toggle Switch */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      {canChange ? <button
                        type="button"
                        role="switch"
                        aria-checked={supplier.isActive}
                        aria-label={`Active status for ${supplier.name}`}
                        onClick={() => canChange && handleToggleStatus(supplier)}
                        disabled={!canChange || actionLoadingId === supplier.id}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60',
                          canChange ? 'cursor-pointer' : 'cursor-not-allowed',
                          supplier.isActive ? 'bg-[#0d7377]' : 'bg-[#cbd5e1]'
                        )}
                        title={
                          !canChange
                            ? 'Permission required'
                            : supplier.isActive
                            ? 'Active (click to deactivate)'
                            : 'Inactive (click to activate)'
                        }
                      >
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                            supplier.isActive ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button> : <span className="text-xs text-ink-soft">{supplier.isActive ? 'Active' : 'Inactive'}</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3.5">
                        {canChange && (
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="text-ink-soft hover:text-ink transition-colors cursor-pointer p-1"
                            title="Edit Supplier"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      <CreateSupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingSupplier={editingSupplier}
        onSuccess={(supplier, message) => {
          setSuppliers((prev) => {
            const exists = prev.some((s) => s.id === supplier.id)
            if (exists) {
              return prev.map((s) => (s.id === supplier.id ? supplier : s))
            }
            return [supplier, ...prev]
          })
          showToast(message)
        }}
      />

    </div>
  )
}

export default SuppliersPage
