'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Shield, Utensils, Save, Check } from 'lucide-react'
import { useStore, RolePermissions } from '@/app/store'
import { Role } from '@/store/user-store'
import { getRoles, getAllPermissions, assignRolePermissions, removeRolePermissions } from '@/lib/api/roles'
import { Role as ApiRole } from '@/lib/types/roles'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card, CardContent } from '@/components/Card'

interface PermissionRow {
  code: string
  isParent: boolean
  parentId?: string
  actions: ('add' | 'change' | 'delete' | 'view')[]
}

const permissionsList: PermissionRow[] = [
  { code: 'meal_item', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'meal_package', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'promotion', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'customer', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'orders', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'customer_feedback', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'payment_record', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'complaints', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'meal_report', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'logs', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'supplier', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'inventory_item', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'low_stock_threshold', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 're_stock', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 're_stock_history', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'supply_request', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'inventory_report', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'system_settings', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'permission_assign', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'role', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'staff', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'analysis_report', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'recovery_account', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
]

export function Permissions() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updateRolePermissions } = useStore()

  // Track the current role being edited
  const [selectedRole, setSelectedRole] = useState<Role>('Catering Manager')
  const [apiRolesList, setApiRolesList] = useState<ApiRole[]>([])
  const [masterPermissionsMap, setMasterPermissionsMap] = useState<Record<string, number>>({})

  const fetchRoles = async () => {
    try {
      const data = await getRoles(true)
      setApiRolesList(data)
      
      const roleParam = searchParams?.get('role')
      if (roleParam && data.find(r => r.role === roleParam)) {
        setSelectedRole(roleParam)
      } else if (data.length > 0) {
        setSelectedRole(prev => data.find(r => r.role === prev) ? prev : data[0].role)
      }
    } catch (error) {
      console.warn('Failed to fetch roles', error)
    }
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchRoles()
      try {
        const allPerms = await getAllPermissions()
        const permsMap: Record<string, number> = {}
        allPerms.forEach((p: any) => {
          permsMap[p.permission_type] = p.permission_id
        })
        setMasterPermissionsMap(permsMap)
      } catch (e) {
        console.warn('Failed to fetch master permissions', e)
      }
    }
    fetchInitialData()
  }, [searchParams])
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Local state for edits
  const [localPermissions, setLocalPermissions] = useState<RolePermissions>({})

  // Toast status notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Load permissions when role changes
  useEffect(() => {
    const activeRole = apiRolesList.find(r => r.role === selectedRole)
    if (!activeRole) return

    const initialPerms: RolePermissions = {}
    const backendPerms = activeRole.permissions || []

    backendPerms.forEach((p: any) => {
      const parts = p.permission_type?.split(':')
      if (parts && parts.length === 2) {
        const module = parts[0]
        const action = parts[1] as 'add' | 'change' | 'delete' | 'view'
        if (!initialPerms[module]) initialPerms[module] = {}
        initialPerms[module][action] = true
      }
    })

    setLocalPermissions(initialPerms)
  }, [selectedRole, apiRolesList])

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // Handle individual checkbox toggle
  const handleCheckboxChange = (
    rowCode: string,
    action: 'add' | 'change' | 'delete' | 'view',
    checked: boolean
  ) => {
    const updated = { ...localPermissions }
    if (!updated[rowCode]) {
      updated[rowCode] = {}
    }
    updated[rowCode] = {
      ...updated[rowCode],
      [action]: checked,
    }
    setLocalPermissions(updated)
  }

  // Handle row-level toggle switch
  const handleToggleChange = (rowCode: string, turnOn: boolean) => {
    const updatedPerms = { ...localPermissions }

    // Find the row
    const row = permissionsList.find((p) => p.code === rowCode)
    if (!row) return

    // Set checkboxes for this row
    updatedPerms[rowCode] = {
      add: turnOn,
      change: turnOn,
      delete: turnOn,
      view: turnOn,
    }

    // If it's a parent, also update all its children
    if (row.isParent) {
      const children = permissionsList.filter((p) => p.parentId === rowCode)
      children.forEach((child) => {
        updatedPerms[child.code] = {
          add: turnOn,
          change: turnOn,
          delete: turnOn,
          view: turnOn,
        }
      })
    }

    setLocalPermissions(updatedPerms)
  }

  // Helper to determine if a row is fully checked
  const isRowAllChecked = (rowCode: string) => {
    const perms = localPermissions[rowCode] || {}
    return !!(perms.add && perms.change && perms.delete && perms.view)
  }

  // Calculate dynamic stats
  const calculateStats = () => {
    let checkedCount = 0
    let totalCount = 0

    permissionsList.forEach((row) => {
      const perms = localPermissions[row.code] || {}
      row.actions.forEach((act) => {
        totalCount++
        if (perms[act]) {
          checkedCount++
        }
      })
    })

    return { checkedCount, totalCount }
  }

  const { checkedCount, totalCount } = calculateStats()

  const handleSave = async () => {
    const activeRole = apiRolesList.find(r => r.role === selectedRole)
    if (!activeRole) return

    const desiredPermStrings: string[] = []
    Object.keys(localPermissions).forEach(module => {
      const perms = localPermissions[module]
      if (perms) {
        Object.keys(perms).forEach(action => {
          if (perms[action as 'add' | 'change' | 'delete' | 'view']) {
            desiredPermStrings.push(`${module}:${action}`)
          }
        })
      }
    })

    const desiredIds = desiredPermStrings
      .map(str => masterPermissionsMap[str])
      .filter(id => id !== undefined)

    const currentBackendPerms = activeRole.permissions || []
    const currentIds = currentBackendPerms
      .map((p: any) => p.permission_id)
      .filter((id: number | undefined) => id !== undefined)

    const idsToAssign = desiredIds.filter(id => !currentIds.includes(id))
    const idsToRemove = currentIds.filter(id => !desiredIds.includes(id))

    try {
      if (idsToAssign.length > 0) {
        await assignRolePermissions(activeRole.id, idsToAssign)
      }
      if (idsToRemove.length > 0) {
        await removeRolePermissions(activeRole.id, idsToRemove)
      }
      
      showToast(`Permissions updated successfully for ${selectedRole}!`)
      updateRolePermissions(selectedRole, localPermissions)
      await fetchRoles()
    } catch (e) {
      showToast(`Failed to update permissions.`)
      console.error(e)
    }
  }

  const handleCancel = () => {
    const activeRole = apiRolesList.find(r => r.role === selectedRole)
    if (!activeRole) return

    const initialPerms: RolePermissions = {}
    const backendPerms = activeRole.permissions || []

    backendPerms.forEach((p: any) => {
      const parts = p.permission_type?.split(':')
      if (parts && parts.length === 2) {
        const module = parts[0]
        const action = parts[1] as 'add' | 'change' | 'delete' | 'view'
        if (!initialPerms[module]) initialPerms[module] = {}
        initialPerms[module][action] = true
      }
    })

    setLocalPermissions(initialPerms)
    showToast('Changes reverted back to saved state.')
  }

  // Group permission rows by their module group
  const groupedModules = [
    {
      id: 'all_permissions',
      name: 'All Permissions',
      rows: permissionsList,
    },
  ]

  const roles: Role[] = apiRolesList.map((r) => r.role as Role)

  const displayTotal = totalCount

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-ink-soft mb-2">
            <span className="cursor-pointer hover:underline" onClick={() => router.push('/dashboard')}>Dashboard</span>
            <span>/</span>
            <span>Roles & Permissions</span>
            <span>/</span>
            <span className="text-ink font-medium">Assign Permissions</span>
          </nav>
          <h2 className="text-2xl font-bold text-ink">Permission Assignment</h2>
          <p className="text-sm text-ink-soft mt-1">Assign specific module permissions to roles</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" onClick={handleSave} className="flex items-center gap-2 shadow-sm shrink-0">
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </div>

      {/* Role Selection Dropdown Card */}
      <Card className="overflow-visible">
        <CardContent className="p-6">
          <div className="relative">
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">
              Select Role
            </label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full md:w-80 h-12 px-4 rounded-control border border-line bg-card text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-ink">{selectedRole}</span>
                <Badge variant="success">Active</Badge>
              </div>
              <ChevronDown size={18} className="text-ink-soft" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-full md:w-80 bg-card rounded-card shadow-lg border border-line py-1.5 z-30">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setSelectedRole(role)
                      setIsDropdownOpen(false)
                    }}
                    className={`flex items-center justify-between w-full px-4 py-3 text-sm text-left hover:bg-canvas transition-colors ${
                      selectedRole === role ? 'font-semibold text-primary bg-primary/5' : 'text-ink'
                    }`}
                  >
                    <span>{role}</span>
                    {selectedRole === role && <Check size={16} className="text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-line mt-6 pt-5 gap-3">
            <span className="text-sm text-ink">
              Editing permissions for: <strong className="font-semibold text-ink">{selectedRole}</strong>
            </span>
            <span className="text-sm font-semibold text-primary">
              {checkedCount} of {displayTotal} permissions assigned
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Assignment Table Card */}
      <Card className="overflow-hidden">
        <div className="px-6 py-5 border-b border-line bg-card">
          <h3 className="text-lg font-semibold text-ink">Module Permissions</h3>
          <p className="text-sm text-ink-soft mt-1">Check the permissions to assign to the selected role</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f5f7] border-b border-line">
                <th className="px-6 py-4 font-semibold text-ink text-xs uppercase tracking-wider w-[240px]">Permission</th>
                <th className="px-6 py-4 font-semibold text-ink text-xs uppercase tracking-wider text-center w-[100px]">All</th>
                <th className="px-6 py-4 font-semibold text-ink text-xs uppercase tracking-wider text-center w-[90px]">Add</th>
                <th className="px-6 py-4 font-semibold text-ink text-xs uppercase tracking-wider text-center w-[90px]">Change</th>
                <th className="px-6 py-4 font-semibold text-ink text-xs uppercase tracking-wider text-center w-[90px]">Delete</th>
                <th className="px-6 py-4 font-semibold text-ink text-xs uppercase tracking-wider text-center w-[90px]">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-card">
              {groupedModules.map((module, mIdx) => (
                <React.Fragment key={module.id}>
                  {module.rows.map((row) => {
                    const isParent = row.isParent
                    const isAllChecked = isRowAllChecked(row.code)
                    const perms = localPermissions[row.code] || {}

                    return (
                      <tr
                        key={row.code}
                        className={`transition-colors hover:bg-canvas/30 ${
                          isParent ? 'bg-canvas/10 font-medium' : ''
                        }`}
                      >
                        {/* Permission Tag/Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`font-mono text-[11px] px-2.5 py-1.5 rounded border leading-none inline-block ${
                              isParent
                                ? 'text-primary bg-primary/5 border-primary/15 font-semibold'
                                : 'text-ink-soft bg-canvas border-line'
                            }`}
                          >
                            {row.code}
                          </span>
                        </td>



                        {/* All Toggle */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center">
                            <button
                              onClick={() => handleToggleChange(row.code, !isAllChecked)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                                isAllChecked ? 'bg-primary' : 'bg-line'
                              }`}
                            >
                              <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isAllChecked ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        </td>

                        {/* Add Checkbox */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={perms.add || false}
                              onChange={(e) =>
                                handleCheckboxChange(row.code, 'add', e.target.checked)
                              }
                              className="h-4 w-4 rounded border-line text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                          </div>
                        </td>

                        {/* Change Checkbox */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={perms.change || false}
                              onChange={(e) =>
                                handleCheckboxChange(row.code, 'change', e.target.checked)
                              }
                              className="h-4 w-4 rounded border-line text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                          </div>
                        </td>

                        {/* Delete Checkbox */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={perms.delete || false}
                              onChange={(e) =>
                                handleCheckboxChange(row.code, 'delete', e.target.checked)
                              }
                              className="h-4 w-4 rounded border-line text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                          </div>
                        </td>

                        {/* View Checkbox */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={perms.view || false}
                              onChange={(e) =>
                                handleCheckboxChange(row.code, 'view', e.target.checked)
                              }
                              className="h-4 w-4 rounded border-line text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {/* Spacing group divider */}
                  {mIdx < groupedModules.length - 1 && (
                    <tr className="h-4 bg-[#f8fafc]/30">
                      <td colSpan={6} className="border-t border-b border-line/50 p-0" />
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer actions inside the table card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-t border-line bg-card gap-4">
          <span className="text-sm text-ink-soft">
            Total:{' '}
            <strong className="font-semibold text-ink">
              {checkedCount} permissions
            </strong>{' '}
            assigned to{' '}
            <strong className="font-semibold text-ink">{selectedRole}</strong>
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" onClick={handleCancel} className="cursor-pointer">
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSave} className="flex items-center gap-2 shadow-sm cursor-pointer">
              <Save size={16} /> Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Permissions

