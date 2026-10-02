'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Eye,
  Ban,
  X,
  User,
  Calendar,
  ShoppingBag,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  getCustomers,
  getCustomerById,
  deactivateCustomer,
  activateCustomer,
} from '@/lib/api/customer'
import { Customer } from '@/lib/types/customer'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}

interface ConfirmModalState {
  customer: Customer
  action: 'deactivate' | 'activate'
}

export function CustomerDirectory() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchCustomerList()
  }, [])

  // Close modals on Escape key press (modal first, then profile drawer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmModal && !actionLoading) {
          setConfirmModal(null)
        } else if (selectedCustomer && !confirmModal) {
          setSelectedCustomer(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [confirmModal, selectedCustomer, actionLoading])

  const fetchCustomerList = async () => {
    setLoading(true)
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch (err) {
      console.error('Failed to load customers:', err)
      showToast('Failed to load customer directory', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewProfile = async (customer: Customer) => {
    setSelectedCustomer(customer)
    try {
      const detail = await getCustomerById(customer.id)
      setSelectedCustomer(detail)
    } catch (err) {
      console.warn('Could not fetch updated customer detail:', err)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  const openConfirmModal = (customer: Customer, action: 'deactivate' | 'activate') => {
    setConfirmModal({ customer, action })
  }

  // Executes status change after confirmation
  const handleExecuteStatusChange = async () => {
    if (!confirmModal) return

    const { customer, action } = confirmModal
    setActionLoading(true)

    try {
      let updated: Customer
      if (action === 'deactivate') {
        updated = await deactivateCustomer(customer.id, customer)
      } else {
        updated = await activateCustomer(customer.id, customer)
      }

      // Update customers table state immediately
      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      )

      // Update active customer profile drawer if currently open
      if (selectedCustomer && selectedCustomer.id === updated.id) {
        setSelectedCustomer(updated)
      }

      // Close modal on success
      setConfirmModal(null)

      // Deactivation / activation feedback message
      showToast(
        action === 'deactivate'
          ? `Customer account for "${customer.name}" has been deactivated.`
          : `Customer account for "${customer.name}" has been reactivated.`,
        'success'
      )
    } catch (error: any) {
      console.error(`Failed to ${action} customer:`, error)
      const message =
        error?.message ||
        `Failed to ${action} customer "${customer.name}". Please try again.`
      showToast(message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter customers based on search query and status filter
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' || c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-5 right-5 z-70 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-in fade-in slide-in-from-bottom-5 duration-300',
            toast.type === 'success' && 'bg-[#0d7377]',
            toast.type === 'error' && 'bg-[#dc2626]',
            toast.type === 'info' && 'bg-[#3b82f6]'
          )}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} className="shrink-0" />}
          {toast.type === 'error' && <AlertTriangle size={18} className="shrink-0" />}
          {toast.type === 'info' && <AlertCircle size={18} className="shrink-0" />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-white/80 hover:text-white ml-2 p-0.5 rounded cursor-pointer transition-colors"
          >
            <X size={15} />
          </button>
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
          <span className="text-ink font-medium">Customers</span>
        </nav>
        <h2 className="text-2xl font-bold text-ink tracking-tight">Customer Directory</h2>
      </div>

      {/* Main Content Card */}
      <Card className="p-5 sm:p-6 space-y-6 bg-white border border-line shadow-card">
        {/* Search & Filter Bar */}
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
              placeholder="Search customers by name, email, or phone..."
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#f4f2ee] border-transparent text-sm text-ink placeholder:text-ink-soft/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | 'Active' | 'Inactive')
                }
                className="h-11 px-4 py-2 rounded-lg bg-[#f4f2ee] border-transparent text-sm text-ink font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer transition-all"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-[#ecf7f7] border-b border-line text-[#4a6b6c] text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Orders</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-card">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm">Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft">
                    <p className="text-base font-medium text-ink">No customers found</p>
                    <p className="text-xs text-ink-soft mt-1">
                      {searchQuery
                        ? `No results matching "${searchQuery}"`
                        : 'No customer records available'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-canvas/30 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="font-semibold text-ink text-sm sm:text-base">
                        {customer.name}
                      </span>
                    </td>

                    {/* Contact (Email & Phone) */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-ink-soft">
                          {customer.email || 'No email provided'}
                        </span>
                        <span className="text-xs text-ink-soft/90 mt-0.5">
                          {customer.phone || 'No phone'}
                        </span>
                      </div>
                    </td>

                    {/* Orders */}
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-ink">
                      {customer.totalOrders}
                    </td>

                    {/* Status Badge with Dot Indicator */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                          customer.isActive
                            ? 'bg-[#d1fae5] text-[#065f46]'
                            : 'bg-[#fee2e2] text-[#991b1b]'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            customer.isActive ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                          )}
                        />
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* Eye mark: Opens detailed customer profile drawer */}
                        <button
                          onClick={() => handleViewProfile(customer)}
                          className="text-ink-soft hover:text-primary transition-colors cursor-pointer p-1.5 rounded-md hover:bg-black/5"
                          title="View customer profile"
                        >
                          <Eye size={18} />
                        </button>

                        {/* Ban / Activate Control Button */}
                        {customer.isActive ? (
                          <button
                            onClick={() => openConfirmModal(customer, 'deactivate')}
                            disabled={actionLoading}
                            className="text-ink-soft hover:text-[#b91c1c] transition-colors cursor-pointer p-1.5 rounded-md hover:bg-red-50 disabled:opacity-50"
                            title="Deactivate customer account"
                          >
                            <Ban size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => openConfirmModal(customer, 'activate')}
                            disabled={actionLoading}
                            className="text-ink-soft hover:text-[#0d7377] transition-colors cursor-pointer p-1.5 rounded-md hover:bg-teal-50 disabled:opacity-50"
                            title="Activate customer account"
                          >
                            <CheckCircle2 size={18} />
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

      {/* ========================================================================= */}
      {/* DETAILED CUSTOMER PROFILE DRAWER (Slides from RIGHT when eye mark is clicked) */}
      {/* ========================================================================= */}
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
          selectedCustomer
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSelectedCustomer(null)}
      />

      {/* Slide-over Drawer from RIGHT */}
      <aside
        aria-label="Detailed Customer Profile"
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-full max-w-[360px] sm:max-w-[400px] bg-[#fdfbf7] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out',
          selectedCustomer ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {selectedCustomer && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-[#fbf9f5] border-b border-[#f0ece5] px-6 py-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">Customer Profile</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-ink-soft hover:text-ink cursor-pointer p-1 rounded-md hover:bg-black/5 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
              {/* Profile Avatar & Name */}
              <div className="flex flex-col items-center text-center pt-2">
                <div className="w-24 h-24 rounded-full bg-[#e6f4f4] flex items-center justify-center text-primary mb-4 shadow-xs">
                  <User size={44} className="text-[#0d7377]" />
                </div>
                <h4 className="text-xl font-bold text-ink mb-2">
                  {selectedCustomer.name}
                </h4>
                <div className="flex justify-center mb-5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold',
                      selectedCustomer.isActive
                        ? 'bg-[#d1fae5] text-[#065f46]'
                        : 'bg-[#fee2e2] text-[#991b1b]'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        selectedCustomer.isActive ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                      )}
                    />
                    {selectedCustomer.isActive ? 'Active Account' : 'Deactivated'}
                  </span>
                </div>

                {/* Metadata List */}
                <div className="w-full space-y-3 text-sm text-[#374151] pt-1">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-ink-soft shrink-0" />
                    <span>Registered: {selectedCustomer.registeredDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={18} className="text-ink-soft shrink-0" />
                    <span>Total Orders: {selectedCustomer.totalOrders}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#f0ece5]" />

              {/* Contact Info */}
              <div className="space-y-2.5 text-sm">
                <h5 className="text-sm font-semibold text-[#4b5563] mb-3">
                  Contact Info
                </h5>
                <div className="text-ink-soft">
                  <span className="text-ink-soft">Email: </span>
                  <span className="text-ink font-medium">
                    {selectedCustomer.email || 'Not provided'}
                  </span>
                </div>
                <div className="text-ink-soft">
                  <span className="text-ink-soft">Phone: </span>
                  <span className="text-ink font-medium">
                    {selectedCustomer.phone || 'Not provided'}
                  </span>
                </div>
                <div className="text-ink-soft">
                  <span className="text-ink-soft">Address: </span>
                  <span className="text-ink font-medium">
                    {selectedCustomer.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer with Deactivation / Activation Control Button */}
            <div className="bg-[#f7f4ef] border-t border-[#f0ece5] p-6">
              {selectedCustomer.isActive ? (
                <button
                  onClick={() => openConfirmModal(selectedCustomer, 'deactivate')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#c97a7e] text-[#9e2a2b] font-medium text-sm bg-transparent hover:bg-red-50/80 transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  <Ban size={16} />
                  <span>Deactivate Account</span>
                </button>
              ) : (
                <button
                  onClick={() => openConfirmModal(selectedCustomer, 'activate')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#14b8a6] text-[#0d7377] font-medium text-sm bg-transparent hover:bg-teal-50/80 transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>Activate Account</span>
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* CONFIRMATION DIALOG (Deactivation / Activation)                           */}
      {/* ========================================================================= */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !actionLoading && setConfirmModal(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-line p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmModal.action === 'deactivate' ? (
              <>
                {/* Deactivation Modal Content */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">Deactivate Customer Account</h3>
                    <p className="text-xs text-ink-soft">Confirmation required</p>
                  </div>
                </div>

                <div className="text-sm text-ink-soft space-y-2 mb-4">
                  <p className="leading-relaxed">
                    Are you sure you want to deactivate the account for{' '}
                    <span className="font-semibold text-ink">
                      &ldquo;{confirmModal.customer.name}&rdquo;
                    </span>
                    ?
                  </p>
                  {confirmModal.customer.email && (
                    <p className="text-xs text-ink-soft bg-[#f9fafb] p-2 rounded border border-[#f3f4f6]">
                      <span className="font-medium text-ink">Associated Email:</span>{' '}
                      {confirmModal.customer.email}
                    </p>
                  )}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2.5 mt-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-normal">
                      The customer will immediately be prevented from logging in or placing meal orders. You can reactivate their account at any time.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f0ece5]">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => setConfirmModal(null)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <button
                    onClick={handleExecuteStatusChange}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold rounded-control bg-[#dc2626] hover:bg-[#b91c1c] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Deactivating...</span>
                      </>
                    ) : (
                      <>
                        <Ban size={16} />
                        <span>Deactivate Account</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Activation Modal Content */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">Activate Customer Account</h3>
                    <p className="text-xs text-ink-soft">Restore customer access</p>
                  </div>
                </div>

                <div className="text-sm text-ink-soft space-y-2 mb-4">
                  <p className="leading-relaxed">
                    Are you sure you want to activate the account for{' '}
                    <span className="font-semibold text-ink">
                      &ldquo;{confirmModal.customer.name}&rdquo;
                    </span>
                    ?
                  </p>
                  <p className="text-xs text-ink-soft bg-[#f0fdf4] border border-[#dcfce7] p-2.5 rounded-lg text-[#166534]">
                    The customer will regain immediate access to log into the application and manage their meal plan subscriptions.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f0ece5]">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => setConfirmModal(null)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <button
                    onClick={handleExecuteStatusChange}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold rounded-control bg-[#0d7377] hover:bg-[#0a5c5f] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Activating...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Activate Account</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerDirectory
