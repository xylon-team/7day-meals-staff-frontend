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
  Loader2,
  Filter,
} from 'lucide-react'
import { getCustomers, getCustomerById, updateCustomerStatus } from '@/lib/api/customer'
import { Customer } from '@/lib/types/customer'
import { Card } from '@/components/Card'
import { cn } from '@/lib/utils'

export function CustomerDirectory() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchCustomerList()
  }, [])

  // Close profile on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCustomer) {
        setSelectedCustomer(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCustomer])

  const fetchCustomerList = async () => {
    setLoading(true)
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch (err) {
      console.error('Failed to load customers:', err)
      showToast('Failed to load customer directory')
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

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const handleToggleStatus = async (customer: Customer) => {
    const newActiveState = !customer.isActive
    setActionLoading(true)
    try {
      const updated = await updateCustomerStatus(customer.id, newActiveState)
      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      )
      if (selectedCustomer && selectedCustomer.id === updated.id) {
        setSelectedCustomer(updated)
      }
      showToast(
        newActiveState
          ? `Account for ${customer.name} activated successfully!`
          : `Account for ${customer.name} deactivated successfully!`
      )
    } catch (error) {
      console.error('Failed to update status:', error)
      showToast('Failed to update customer status')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter customers based on search and status
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
              placeholder="Search customers..."
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
                        <span className="text-sm text-ink-soft">{customer.email}</span>
                        <span className="text-xs text-ink-soft/90 mt-0.5">
                          {customer.phone}
                        </span>
                      </div>
                    </td>

                    {/* Orders */}
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-ink">
                      {customer.totalOrders}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                          customer.isActive
                            ? 'bg-[#d1fae5] text-[#065f46]'
                            : 'bg-[#e5e7eb] text-[#4b5563]'
                        )}
                      >
                        {customer.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3.5">
                        {/* Eye mark: Opens detailed customer profile drawer sliding from right */}
                        <button
                          onClick={() => handleViewProfile(customer)}
                          className="text-ink-soft hover:text-primary transition-colors cursor-pointer p-1"
                          title="View customer profile"
                        >
                          <Eye size={18} />
                        </button>

                        {/* Ban / Deactivate mark */}
                        <button
                          onClick={() => handleToggleStatus(customer)}
                          disabled={actionLoading}
                          className="text-ink-soft hover:text-danger-fg transition-colors cursor-pointer p-1 disabled:opacity-50"
                          title={
                            customer.isActive
                              ? 'Deactivate account'
                              : 'Activate account'
                          }
                        >
                          <Ban size={18} />
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
                      'inline-flex items-center px-3.5 py-0.5 rounded-full text-xs font-semibold',
                      selectedCustomer.isActive
                        ? 'bg-[#d1fae5] text-[#065f46]'
                        : 'bg-[#e5e7eb] text-[#4b5563]'
                    )}
                  >
                    {selectedCustomer.status}
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
                    {selectedCustomer.email}
                  </span>
                </div>
                <div className="text-ink-soft">
                  <span className="text-ink-soft">Phone: </span>
                  <span className="text-ink font-medium">
                    {selectedCustomer.phone}
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

            {/* Footer with Action Button */}
            <div className="bg-[#f7f4ef] border-t border-[#f0ece5] p-6">
              {selectedCustomer.isActive ? (
                <button
                  onClick={() => handleToggleStatus(selectedCustomer)}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded-lg border border-[#c97a7e] text-[#9e2a2b] font-medium text-sm bg-transparent hover:bg-red-50/70 transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Deactivate Account'}
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus(selectedCustomer)}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded-lg border border-[#14b8a6] text-[#0d7377] font-medium text-sm bg-transparent hover:bg-teal-50/70 transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Activate Account'}
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

export default CustomerDirectory
