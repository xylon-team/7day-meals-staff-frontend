'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Truck,
  Phone,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import {
  getSuppliers,
  toggleSupplierStatus,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '@/lib/api/supplier'
import { Supplier, CreateSupplierDto } from '@/lib/types/supplier'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'

export function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [modalName, setModalName] = useState('')
  const [modalContactPerson, setModalContactPerson] = useState('')
  const [modalEmail, setModalEmail] = useState('')
  const [modalPhone, setModalPhone] = useState('')
  const [modalCategories, setModalCategories] = useState('')
  const [modalIsActive, setModalIsActive] = useState(true)
  const [modalSubmitting, setModalSubmitting] = useState(false)

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
      const updated = await toggleSupplierStatus(supplier.id, newStatus)
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
    setModalName('')
    setModalContactPerson('')
    setModalEmail('')
    setModalPhone('')
    setModalCategories('')
    setModalIsActive(true)
    setIsModalOpen(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setModalName(supplier.name)
    setModalContactPerson(supplier.contactPerson)
    setModalEmail(supplier.email)
    setModalPhone(supplier.phone)
    setModalCategories(supplier.categories.join(', '))
    setModalIsActive(supplier.isActive)
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalName.trim() || !modalContactPerson.trim()) return

    const parsedCategories = modalCategories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    setModalSubmitting(true)
    try {
      if (editingSupplier) {
        const updated = await updateSupplier(editingSupplier.id, {
          name: modalName.trim(),
          contactPerson: modalContactPerson.trim(),
          email: modalEmail.trim(),
          phone: modalPhone.trim(),
          categories: parsedCategories.length > 0 ? parsedCategories : ['General'],
          isActive: modalIsActive,
        })
        setSuppliers((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        )
        showToast(`Supplier "${modalName}" updated successfully!`)
      } else {
        const created = await createSupplier({
          name: modalName.trim(),
          contactPerson: modalContactPerson.trim(),
          email: modalEmail.trim(),
          phone: modalPhone.trim(),
          categories: parsedCategories.length > 0 ? parsedCategories : ['General'],
          isActive: modalIsActive,
        })
        setSuppliers((prev) => [created, ...prev])
        showToast(`Supplier "${modalName}" added successfully!`)
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error('Failed to save supplier:', err)
      showToast('Failed to save supplier details')
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleDeleteSupplier = async () => {
    if (!deleteConfirm) return
    setIsDeleting(true)
    try {
      await deleteSupplier(deleteConfirm.id)
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteConfirm.id))
      showToast(`Supplier "${deleteConfirm.name}" deleted successfully!`)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete supplier:', err)
      showToast('Failed to delete supplier')
    } finally {
      setIsDeleting(false)
    }
  }

  // Extract all unique categories for the dropdown filter
  const allCategories = Array.from(
    new Set(suppliers.flatMap((s) => s.categories))
  ).filter(Boolean)

  // Filter suppliers by search query and category
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.categories.some((cat) => cat.toLowerCase().includes(q))

    const matchesCategory =
      categoryFilter === 'ALL' || s.categories.includes(categoryFilter)

    return matchesSearch && matchesCategory
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
          <Button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#0d7377] hover:bg-[#0a5c60] text-white font-medium px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <Plus size={18} />
            <span>Add Supplier</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Card */}
      <Card className="p-5 sm:p-6 space-y-6 bg-white border border-line shadow-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-11 px-4 py-2 rounded-lg bg-[#f4f2ee] border-transparent text-sm text-ink font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer transition-all min-w-[140px]"
            >
              <option value="ALL">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
                <th className="px-6 py-4 font-semibold">Categories</th>
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

                    {/* Categories */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {supplier.categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#dbeafe] text-[#1e40af]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status Toggle Switch */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={supplier.isActive}
                        onClick={() => handleToggleStatus(supplier)}
                        disabled={actionLoadingId === supplier.id}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60',
                          supplier.isActive ? 'bg-[#0d7377]' : 'bg-[#cbd5e1]'
                        )}
                        title={
                          supplier.isActive
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
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3.5">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="text-ink-soft hover:text-ink transition-colors cursor-pointer p-1"
                          title="Edit Supplier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(supplier)}
                          className="text-ink-soft hover:text-danger-fg transition-colors cursor-pointer p-1"
                          title="Delete Supplier"
                        >
                          <Trash2 size={16} />
                        </button>
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card rounded-card shadow-xl border border-line overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-canvas/30">
              <h3 className="text-lg font-bold text-ink">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-soft hover:text-ink cursor-pointer p-1 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g. Perera Distributors"
                  className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={modalContactPerson}
                  onChange={(e) => setModalContactPerson(e.target.value)}
                  placeholder="e.g. Kamal Perera"
                  className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="e.g. kamal@example.com"
                    className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    placeholder="e.g. 0771112223"
                    className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Categories (comma separated)
                </label>
                <input
                  type="text"
                  value={modalCategories}
                  onChange={(e) => setModalCategories(e.target.value)}
                  placeholder="e.g. Grains, Spices, Meat"
                  className="w-full h-10 px-3 rounded-control border border-line bg-card text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-ink">Active Status</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={modalIsActive}
                  onClick={() => setModalIsActive(!modalIsActive)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary',
                    modalIsActive ? 'bg-[#0d7377]' : 'bg-[#cbd5e1]'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                      modalIsActive ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 bg-card border border-line shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-danger-fg mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-ink">Delete Supplier</h3>
            </div>
            <p className="text-sm text-ink-soft mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-ink">
                &ldquo;{deleteConfirm.name}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteSupplier}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SuppliersPage
