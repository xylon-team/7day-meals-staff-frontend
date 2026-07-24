import { useUserStore } from '@/store/user-store'

/**
 * Returns whether the current user has a specific permission.
 *
 * @param module  The permission module code, e.g. "inventory_item", "supplier"
 * @param action  Optional action: "add" | "change" | "delete" | "view"
 *                If omitted, returns true if the user has ANY permission for the module.
 *
 * Admin users (role === 'Admin') always return true.
 * If permissions haven't loaded yet, returns false for non-Admins (safe default).
 *
 * Usage examples:
 *   const canView    = usePermission('inventory_item', 'view')
 *   const canAdd     = usePermission('inventory_item', 'add')
 *   const hasAnyInv  = usePermission('inventory_item')
 */
export function usePermission(
  module: string,
  action?: 'add' | 'change' | 'delete' | 'view'
): boolean {
  const user = useUserStore((state) => state.user)

  if (!user) return false

  // Admins always have full access
  if (user.role === 'Admin') return true

  // If permissions haven't been fetched yet, deny by default (defensive)
  if (!user.permissions) return false

  if (action) {
    return user.permissions.includes(`${module}_${action}`)
  }

  // No specific action — return true if any permission for this module exists
  return user.permissions.some((p) => p.startsWith(`${module}_`))
}
