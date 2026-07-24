'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Save, Check } from 'lucide-react'
import { useStore, RolePermissions, PermissionActions } from '@/app/store'
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

const defaultPermissionsList: PermissionRow[] = [
  { code: 'meal_item', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'meal_package', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'promotion', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'customer', isParent: false, actions: ['delete', 'view'] },
  { code: 'orders', isParent: false, actions: ['change', 'delete', 'view'] },
  { code: 'customer_feedback', isParent: false, actions: ['change', 'view'] },
  { code: 'payment_record', isParent: false, actions: ['view'] },
  { code: 'complaints', isParent: false, actions: ['change', 'view'] },
  { code: 'meal_report', isParent: false, actions: ['add', 'view'] },
  { code: 'logs', isParent: false, actions: ['view'] },
  { code: 'supplier', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'inventory_item', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'low_stock_threshold', isParent: false, actions: ['add', 'change', 'view'] },
  { code: 'restock', isParent: false, actions: ['add', 'view'] },
  { code: 'restock_history', isParent: false, actions: ['view'] },
  { code: 'supply_request', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'inventory_report', isParent: false, actions: ['add', 'view'] },
  { code: 'system_settings', isParent: false, actions: ['change', 'view'] },
  { code: 'permission_assign', isParent: false, actions: ['change', 'view'] },
  { code: 'role', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'staff', isParent: false, actions: ['add', 'change', 'delete', 'view'] },
  { code: 'analysis_report', isParent: false, actions: ['add', 'view'] },
  { code: 'recovery_account', isParent: false, actions: ['change', 'view'] },
]

const parsePermissionType = (type: string) => {
  if (!type) return null
  const lastUnderscoreIndex = type.lastIndexOf('_')
  if (lastUnderscoreIndex === -1) return null

  const modCode = type.substring(0, lastUnderscoreIndex)
  const action = type.substring(lastUnderscoreIndex + 1) as 'add' | 'change' | 'delete' | 'view'

  if (!['add', 'change', 'delete', 'view'].includes(action)) return null
  return { modCode, action }
}


interface DbPermission {
  permission_id: number
  permission_type: string
}

export function Permissions() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updateRolePermissions } = useStore()

  // Track the current role being edited
  const [selectedRole, setSelectedRole] = useState<Role>('Catering Manager')
  const [apiRolesList, setApiRolesList] = useState<ApiRole[]>([])
  const [masterPermissionsMap, setMasterPermissionsMap] = useState<Record<string, number>>({})
  const [permissionsList, setPermissionsList] = useState<PermissionRow[]>(defaultPermissionsList)

  const fetchRoles = useCallback(async () => {
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
  }, [searchParams])

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchRoles()
      try {
        const allPerms = (await getAllPermissions()) as DbPermission[]
        const permsMap: Record<string, number> = {}
        allPerms.forEach((p) => {
          if (p.permission_type) {
            permsMap[p.permission_type] = p.permission_id
          }
        })
        setMasterPermissionsMap(permsMap)

        // Dynamically group permissions by module to build permissionsList
        const moduleMap: Record<string, ('add' | 'change' | 'delete' | 'view')[]> = {}
        allPerms.forEach((p) => {
          const parsed = parsePermissionType(p.permission_type)
          if (parsed) {
            const { modCode, action } = parsed
            if (!moduleMap[modCode]) {
              moduleMap[modCode] = []
            }
            if (!moduleMap[modCode].includes(action)) {
              moduleMap[modCode].push(action)
            }
          }
        })

        const dynamicList: PermissionRow[] = Object.keys(moduleMap).map(modName => ({
          code: modName,
          isParent: false,
          actions: moduleMap[modName]
        }))

        // Sort modules alphabetically so they display consistently
        dynamicList.sort((a, b) => a.code.localeCompare(b.code))

        if (dynamicList.length > 0) {
          setPermissionsList(dynamicList)
        }
      } catch (e) {
        console.warn('Failed to fetch master permissions', e)
      }
    }
    fetchInitialData()
  }, [searchParams, fetchRoles])
  
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
    const backendPerms = (activeRole.permissions || []) as unknown as DbPermission[]

    backendPerms.forEach((p) => {
      const parsed = parsePermissionType(p.permission_type)
      if (parsed) {
        const { modCode, action } = parsed
        if (!initialPerms[modCode]) initialPerms[modCode] = {}
        initialPerms[modCode][action] = true
      }
    })

    // Wrap in setTimeout to avoid calling setState synchronously inside the effect body
    const timer = setTimeout(() => {
      setLocalPermissions(initialPerms)
    }, 0)
    return () => clearTimeout(timer)
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

    // Set checkboxes for this row based on supported actions
    const rowPerms: PermissionActions = {}
    row.actions.forEach((act) => {
      rowPerms[act] = turnOn
    })
    updatedPerms[rowCode] = rowPerms

    // If it's a parent, also update all its children
    if (row.isParent) {
      const children = permissionsList.filter((p) => p.parentId === rowCode)
      children.forEach((child) => {
        const childPerms: PermissionActions = {}
        child.actions.forEach((act) => {
          childPerms[act] = turnOn
        })
        updatedPerms[child.code] = childPerms
      })
    }

    setLocalPermissions(updatedPerms)
  }

  // Helper to determine if a row is fully checked
  const isRowAllChecked = (rowCode: string) => {
    const row = permissionsList.find((p) => p.code === rowCode)
    if (!row) return false
    const perms = localPermissions[rowCode] || {}
    return row.actions.every((act) => !!perms[act])
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
    Object.keys(localPermissions).forEach(modName => {
      const perms = localPermissions[modName]
      if (perms) {
        Object.keys(perms).forEach(action => {
          if (perms[action as 'add' | 'change' | 'delete' | 'view']) {
            desiredPermStrings.push(`${modName}_${action}`)
          }
        })
      }
    })

    const desiredIds = desiredPermStrings
      .map(str => masterPermissionsMap[str])
      .filter(id => id !== undefined)

    const currentBackendPerms = (activeRole.permissions || []) as unknown as DbPermission[]
    const currentIds = currentBackendPerms
      .map((p) => p.permission_id)
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
    const backendPerms = (activeRole.permissions || []) as unknown as DbPermission[]

    backendPerms.forEach((p) => {
      const parsed = parsePermissionType(p.permission_type)
      if (parsed) {
        const { modCode, action } = parsed
        if (!initialPerms[modCode]) initialPerms[modCode] = {}
        initialPerms[modCode][action] = true
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
                          {row.actions.includes('add') ? (
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
                          ) : (
                            <span className="text-ink-soft opacity-30 font-medium">-</span>
                          )}
                        </td>

                        {/* Change Checkbox */}
                        <td className="px-6 py-4 text-center">
                          {row.actions.includes('change') ? (
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
                          ) : (
                            <span className="text-ink-soft opacity-30 font-medium">-</span>
                          )}
                        </td>

                        {/* Delete Checkbox */}
                        <td className="px-6 py-4 text-center">
                          {row.actions.includes('delete') ? (
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
                          ) : (
                            <span className="text-ink-soft opacity-30 font-medium">-</span>
                          )}
                        </td>

                        {/* View Checkbox */}
                        <td className="px-6 py-4 text-center">
                          {row.actions.includes('view') ? (
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
                          ) : (
                            <span className="text-ink-soft opacity-30 font-medium">-</span>
                          )}
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

