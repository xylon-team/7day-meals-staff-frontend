'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users as UsersIcon,
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import { useStore, UserItem } from '@/app/store'
import { getRoles, createRole, updateRole as updateRoleApi, deleteRole as deleteRoleApi } from '@/lib/api/roles'
import { Role } from '@/lib/types/roles'
import { getStaff, createStaff, updateStaff as updateStaffApi, deleteStaff as deleteStaffApi, assignStaffRole, removeStaffRole } from '@/lib/api/staff'
import { Staff, StaffStatus } from '@/lib/types/staff'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card, CardContent } from '@/components/Card'
import { Input } from '@/components/Input'
import { isValidPersonName } from '@/lib/validation/person-name'



export function Users() {
  const router = useRouter()
  const [apiRolesList, setApiRolesList] = useState<Role[]>([])
  const [apiStaffList, setApiStaffList] = useState<Staff[]>([])

  useEffect(() => {
    fetchRoles()
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const staff = await getStaff()
      setApiStaffList(staff)
    } catch (error) {
      console.warn('Fetch error:', error)
      showToast('Failed to fetch staff users')
    }
  }

  const fetchRoles = async () => {
    try {
      const roles = await getRoles(true)
      setApiRolesList(roles)
    } catch (error) {
      console.warn('Fetch error:', error)
      showToast('Failed to fetch roles')
    }
  }

  // Search input query
  const [searchQuery, setSearchQuery] = useState('')

  // Toast status notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [roleEditing, setRoleEditing] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')

  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [userEditing, setUserEditing] = useState<Staff | null>(null)
  const [userFirstName, setUserFirstName] = useState('')
  const [userLastName, setUserLastName] = useState('')
  const [userPhone, setUserPhone] = useState('+94')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userConfirmPassword, setUserConfirmPassword] = useState('')
  const [userRole, setUserRole] = useState('')
  const [userActive, setUserActive] = useState<StaffStatus>(StaffStatus.ACTIVE)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Delete Confirmation Modals state
  const [deleteRoleConfirm, setDeleteRoleConfirm] = useState<{id: number, name: string} | null>(null)
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<number | null>(null)

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }



  const getRoleBadgeVariant = (roleName: string) => {
    if (roleName === 'Admin') return 'info'
    if (roleName === 'Catering Manager') return 'warning'
    if (roleName === 'Inventory Manager') return 'success'
    return 'default'
  }

  // Filter users by search query
  const filteredUsers = apiStaffList.filter(
    (u) =>
      `${u.fname} ${u.lname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handlers for Roles Modals
  const openRoleModal = (role: Role | null = null) => {
    if (role) {
      setRoleEditing(role)
      setRoleName(role.role)
      setRoleDescription(role.description)
    } else {
      setRoleEditing(null)
      setRoleName('')
      setRoleDescription('')
    }
    setIsRoleModalOpen(true)
  }

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim()) return

    try {
      if (roleEditing) {
        await updateRoleApi(roleEditing.id, {
          role: roleName,
          description: roleDescription,
        })
        showToast(`Role "${roleName}" updated successfully!`)
      } else {
        // Check for duplicate names
        if (apiRolesList.some((r) => r.role.toLowerCase() === roleName.toLowerCase())) {
          showToast('Role with this name already exists.')
          return
        }
        await createRole({
          role: roleName,
          description: roleDescription,
        })
        showToast(`Role "${roleName}" created successfully!`)
      }
      await fetchRoles()
      setIsRoleModalOpen(false)
    } catch (error: any) {
      showToast(error.message || 'Failed to save role')
    }
  }

  const handleDeleteRole = async (id: number, name: string) => {
    try {
      await deleteRoleApi(id)
      showToast(`Role "${name}" deleted.`)
      setDeleteRoleConfirm(null)
      await fetchRoles()
    } catch (error: any) {
      showToast(error.message || 'Failed to delete role')
    }
  }

  // Handlers for Users Modals
  const openUserModal = (user: Staff | null = null) => {
    setErrors({})
    if (user) {
      setUserEditing(user)
      setUserFirstName(user.fname)
      setUserLastName(user.lname)
      setUserEmail(user.email || '')
      setUserRole(user.role || apiRolesList[0]?.role || 'Admin')
      setUserActive(user.status)
      setUserPhone(user.phone_number || '+94')
      setUserPassword('')
      setUserConfirmPassword('')
    } else {
      setUserEditing(null)
      setUserFirstName('')
      setUserLastName('')
      setUserEmail('')
      setUserRole(apiRolesList[0]?.role || 'Admin')
      setUserActive(StaffStatus.ACTIVE)
      setUserPhone('+94')
      setUserPassword('')
      setUserConfirmPassword('')
    }
    setIsUserModalOpen(true)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // First Name validation
    if (!userFirstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (!isValidPersonName(userFirstName)) {
      newErrors.firstName = 'Enter a valid name using letters, spaces, apostrophes, or hyphens'
    }

    // Last Name validation
    if (!userLastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (!isValidPersonName(userLastName)) {
      newErrors.lastName = 'Enter a valid name using letters, spaces, apostrophes, or hyphens'
    }

    // Phone validation
    const phoneTrimmed = userPhone.trim()
    if (!phoneTrimmed) {
      newErrors.phone = 'Phone number is required'
    } else {
      // Sri Lankan phone number formats (Accept +94XXXXXXXXX or 0XXXXXXXXX)
      const phoneRegex = /^(?:\+94|0)?7[0-9]{8}$/
      if (!phoneRegex.test(phoneTrimmed)) {
        newErrors.phone = 'Enter a valid Sri Lankan phone number (e.g. +94771234567 or 0771234567)'
      }
    }

    // Email validation
    const emailTrimmed = userEmail.trim()
    if (!emailTrimmed) {
      newErrors.email = 'Email address is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailTrimmed)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    // Password validation (only required for new user, or if password field is filled during edit)
    if (!userEditing) {
      if (!userPassword) {
        newErrors.password = 'Password is required'
      } else {
        if (userPassword.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long'
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(userPassword)) {
          newErrors.password = 'Password must contain at least one uppercase, lowercase, number, and special character'
        }
      }

      if (!userConfirmPassword) {
        newErrors.confirmPassword = 'Confirm password is required'
      } else if (userPassword !== userConfirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    } else {
      // For editing, password is optional, but if entered, it must meet constraints
      if (userPassword) {
        if (userPassword.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long'
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(userPassword)) {
          newErrors.password = 'Password must contain at least one uppercase, lowercase, number, and special character'
        }

        if (!userConfirmPassword) {
          newErrors.confirmPassword = 'Confirm password is required'
        } else if (userPassword !== userConfirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      showToast('Please fix the validation errors in the form.')
      return
    }

    const fullName = `${userFirstName.trim()} ${userLastName.trim()}`.trim()

    try {
      if (userEditing) {
        await updateStaffApi(userEditing.id, {
          fname: userFirstName.trim(),
          lname: userLastName.trim(),
          phone_number: userPhone.trim(),
          status: userActive,
          email: userEmail.trim(),
          ...(userPassword ? { staff_password: userPassword } : {})
        })

        // If the role has changed, update it in the database
        if (userEditing.role !== userRole) {
          if (userEditing.role) {
            const oldRoleObj = apiRolesList.find((r) => r.role === userEditing.role)
            if (oldRoleObj) {
              await removeStaffRole(userEditing.id, oldRoleObj.id)
            }
          }
          const newRoleObj = apiRolesList.find((r) => r.role === userRole)
          if (newRoleObj) {
            await assignStaffRole(userEditing.id, newRoleObj.id)
          }
        }

        showToast(`User "${fullName}" updated successfully!`)
      } else {
        const newStaff = await createStaff({
          fname: userFirstName.trim(),
          lname: userLastName.trim(),
          phone_number: userPhone.trim(),
          status: userActive,
          email: userEmail.trim(),
          staff_password: userPassword
        })

        // Assign the selected role to the newly created staff member
        const selectedRoleObj = apiRolesList.find((r) => r.role === userRole)
        if (selectedRoleObj && newStaff && newStaff.id) {
          await assignStaffRole(newStaff.id, selectedRoleObj.id)
        }

        showToast(`User "${fullName}" created successfully!`)
      }
      await fetchStaff()
      setIsUserModalOpen(false)
    } catch (error: any) {
      showToast(error.message || 'Failed to save user')
    }
  }

  const handleDeleteUser = async (id: number, name: string) => {
    try {
      await deleteStaffApi(id)
      showToast(`User "${name}" deleted.`)
      setDeleteUserConfirm(null)
      await fetchStaff()
    } catch (error: any) {
      showToast(error.message || 'Failed to delete user')
    }
  }

  const toggleUserStatus = async (id: number, currentStatus: StaffStatus, name: string) => {
    try {
      const newStatus = currentStatus === StaffStatus.ACTIVE ? StaffStatus.INACTIVE : StaffStatus.ACTIVE
      await updateStaffApi(id, { status: newStatus })
      showToast(`User "${name}" is now ${newStatus === StaffStatus.ACTIVE ? 'Active' : 'Inactive'}.`)
      await fetchStaff()
    } catch (error: any) {
      showToast(error.message || 'Failed to change user status')
    }
  }

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
          <span className="cursor-pointer hover:underline" onClick={() => router.push('/dashboard')}>Dashboard</span>
          <span>/</span>
          <span className="text-ink font-medium">Roles & Users</span>
        </nav>
        <h2 className="text-2xl font-bold text-ink">Roles & Users</h2>
      </div>

      {/* ==================== ROLES SECTION ==================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Roles</h3>
        </div>

        <Card>
          <div className="px-6 py-5 border-b border-line bg-card flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-semibold text-base">
              <Shield size={20} />
              <span>Roles</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openRoleModal()}
              className="flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Create Role
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-[#f2f5f7] border-b border-line text-ink-soft text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 w-[220px]">Role Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 w-[160px]">Permissions</th>
                  <th className="px-6 py-4 text-right w-[160px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-card">
                {apiRolesList.map((role) => {
                  return (
                    <tr key={role.id} className="hover:bg-canvas/30 transition-colors">
                      {/* Role Badge */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        <Badge variant={getRoleBadgeVariant(role.role)} className="px-3 py-1 text-sm font-semibold rounded-md">
                          {role.role}
                        </Badge>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-5 text-ink-soft text-sm">
                        {role.description}
                      </td>

                      {/* Permissions Count */}
                      <td className="px-6 py-5 font-bold text-ink text-sm">
                        {role.permissions?.length || 0}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3.5">
                          <button
                            onClick={() => router.push(`/roles?role=${encodeURIComponent(role.role)}`)}
                            className="text-ink-soft hover:text-primary transition-colors cursor-pointer"
                            title="Manage Permissions"
                          >
                            <ShieldCheck size={18} />
                          </button>
                          <button
                            onClick={() => openRoleModal(role)}
                            className="text-ink-soft hover:text-ink transition-colors cursor-pointer"
                            title="Edit Role"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteRoleConfirm({id: role.id, name: role.role})}
                            className="text-danger-fg hover:text-danger-fg/80 transition-colors cursor-pointer"
                            title="Delete Role"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ==================== USERS SECTION ==================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Users</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openUserModal()}
            className="flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Create User
          </Button>
        </div>

        <Card>
          <div className="p-4 border-b border-line bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="h-10 pl-10 pr-4 rounded-control border border-line bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full transition-all text-ink placeholder:text-ink-soft"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-[#f2f5f7] border-b border-line text-ink-soft text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 w-[240px]">Name</th>
                  <th className="px-6 py-4 w-[260px]">Email</th>
                  <th className="px-6 py-4 w-[200px]">Role</th>
                  <th className="px-6 py-4 text-center w-[120px]">Status</th>
                  <th className="px-6 py-4 text-right w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-card">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-canvas/30 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 font-bold text-ink text-sm">
                        {`${user.fname} ${user.lname}`}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-ink-soft text-sm">
                        {user.email}
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getRoleBadgeVariant(user.role || 'User')} className="px-2.5 py-0.5 text-xs font-semibold">
                          {user.role || 'User'}
                        </Badge>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center">
                          <button
                            onClick={() => toggleUserStatus(user.id, user.status, `${user.fname} ${user.lname}`)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              user.status === StaffStatus.ACTIVE ? 'bg-[#0a5c60]' : 'bg-line'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                user.status === StaffStatus.ACTIVE ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-ink-soft text-sm">
                        <div className="flex items-center justify-end gap-4">
                          <button
                            onClick={() => openUserModal(user)}
                            className="hover:text-ink transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteUserConfirm(user.id)}
                            className="text-danger-fg hover:text-danger-fg/80 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-ink-soft">
                      No users found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ==================== CREATE / EDIT ROLE MODAL ==================== */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border border-line bg-card overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-[#fcfbfa]">
              <h3 className="text-lg font-bold text-ink">
                {roleEditing ? 'Edit Role' : 'Create Custom Role'}
              </h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-ink-soft hover:text-ink cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit}>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Role Name
                  </label>
                  <Input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Sales Manager"
                    required
                    disabled={roleEditing !== null}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Describe the responsibilities of this role..."
                    className="w-full min-h-24 p-3 border border-line rounded-control bg-card text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </CardContent>
              <div className="px-6 py-4 bg-[#fcfbfa] border-t border-line flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="cursor-pointer">
                  {roleEditing ? 'Save Changes' : 'Create Role'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ==================== CREATE / EDIT USER MODAL ==================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-[560px] shadow-2xl border border-line bg-card overflow-hidden animate-in zoom-in-95 duration-200 rounded-xl">
            <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-card">
              <h3 className="text-xl font-semibold text-ink">
                {userEditing ? 'Edit User' : 'Create User'}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-ink-soft hover:text-ink cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} noValidate>
              <CardContent className="p-6 space-y-5">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#2d3748] mb-2">
                      First Name
                    </label>
                    <Input
                      type="text"
                      value={userFirstName}
                      onChange={(e) => {
                        setUserFirstName(e.target.value)
                        if (errors.firstName) {
                          setErrors((prev) => ({ ...prev, firstName: '' }))
                        }
                      }}
                      error={errors.firstName}
                      placeholder="e.g. John"
                      className="h-11 border-line bg-card rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2d3748] mb-2">
                      Last Name
                    </label>
                    <Input
                      type="text"
                      value={userLastName}
                      onChange={(e) => {
                        setUserLastName(e.target.value)
                        if (errors.lastName) {
                          setErrors((prev) => ({ ...prev, lastName: '' }))
                        }
                      }}
                      error={errors.lastName}
                      placeholder="e.g. Doe"
                      className="h-11 border-line bg-card rounded-lg"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#2d3748] mb-2">
                      Phone
                    </label>
                    <Input
                      type="text"
                      value={userPhone}
                      onChange={(e) => {
                        setUserPhone(e.target.value)
                        if (errors.phone) {
                          setErrors((prev) => ({ ...prev, phone: '' }))
                        }
                      }}
                      error={errors.phone}
                      placeholder="e.g. +94771234567"
                      className="h-11 border-line bg-card rounded-lg"
                    />
                  </div>
                  <div></div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-[#2d3748] mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value)
                      if (errors.email) {
                        setErrors((prev) => ({ ...prev, email: '' }))
                      }
                    }}
                    error={errors.email}
                    placeholder="e.g. john.doe@example.com"
                    className="h-11 border-line bg-card rounded-lg"
                  />
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#2d3748] mb-2">
                      Password {userEditing && <span className="text-xs text-ink-soft">(Optional)</span>}
                    </label>
                    <Input
                      type="password"
                      value={userPassword}
                      onChange={(e) => {
                        setUserPassword(e.target.value)
                        if (errors.password) {
                          setErrors((prev) => ({ ...prev, password: '' }))
                        }
                      }}
                      error={errors.password}
                      placeholder={userEditing ? "Leave blank to keep current" : "••••••••"}
                      className="h-11 border-line bg-card rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2d3748] mb-2">
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      value={userConfirmPassword}
                      onChange={(e) => {
                        setUserConfirmPassword(e.target.value)
                        if (errors.confirmPassword) {
                          setErrors((prev) => ({ ...prev, confirmPassword: '' }))
                        }
                      }}
                      error={errors.confirmPassword}
                      placeholder="••••••••"
                      className="h-11 border-line bg-card rounded-lg"
                    />
                  </div>
                </div>

                {/* Role & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#2d3748] mb-2">
                      Role
                    </label>
                    <div className="relative">
                      <select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                        className="w-full h-11 pl-3 pr-10 border border-line rounded-lg bg-card text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer appearance-none"
                      >
                        {apiRolesList.map((r) => (
                          <option key={r.id} value={r.role}>
                            {r.role}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-soft">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2d3748] mb-2">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={userActive}
                        onChange={(e) => setUserActive(e.target.value as StaffStatus)}
                        className="w-full h-11 pl-3 pr-10 border border-line rounded-lg bg-card text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer appearance-none"
                      >
                        <option value={StaffStatus.ACTIVE}>Active</option>
                        <option value={StaffStatus.INACTIVE}>Inactive</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-soft">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 py-5 border-t border-line flex justify-end items-center gap-4 bg-card">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="text-[#0a5c60] hover:text-[#074749] font-medium text-sm px-4 py-2 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0a5c60] hover:bg-[#074749] text-white font-medium text-sm px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  {userEditing ? 'Save Changes' : 'Save User'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ==================== DELETE ROLE CONFIRMATION ==================== */}
      {deleteRoleConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl border border-line bg-card overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-danger-bg text-danger-fg flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-ink">Delete Role?</h4>
                <p className="text-sm text-ink-soft mt-1">
                  Are you sure you want to delete the role "{deleteRoleConfirm.name}"? This will also clear its permission settings.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-[#fcfbfa] border-t border-line flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteRoleConfirm(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => handleDeleteRole(deleteRoleConfirm.id, deleteRoleConfirm.name)}
                className="cursor-pointer"
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ==================== DELETE USER CONFIRMATION ==================== */}
      {deleteUserConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl border border-line bg-card overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-danger-bg text-danger-fg flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-ink">Delete User?</h4>
                <p className="text-sm text-ink-soft mt-1">
                  Are you sure you want to delete this staff user account? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-[#fcfbfa] border-t border-line flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteUserConfirm(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  const user = apiStaffList.find((u) => u.id === deleteUserConfirm)
                  if (user) handleDeleteUser(user.id, `${user.fname} ${user.lname}`)
                }}
                className="cursor-pointer"
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Users
