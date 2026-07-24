import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Role } from '@/store/user-store'

export interface PermissionActions {
  add?: boolean
  change?: boolean
  delete?: boolean
  view?: boolean
}

export interface RolePermissions {
  [permissionCode: string]: PermissionActions
}

export interface PermissionsMapping {
  [roleName: string]: RolePermissions
}

export interface RoleItem {
  name: string
  description: string
}

export interface UserItem {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  phone?: string
}

interface StoreState {

  permissions: PermissionsMapping
  updateRolePermissions: (role: Role, permissions: RolePermissions) => void
  rolesList: RoleItem[]
  usersList: UserItem[]
  addRole: (role: RoleItem) => void
  updateRole: (name: string, updates: Partial<RoleItem>) => void
  deleteRole: (name: string) => void
  addUser: (user: Omit<UserItem, 'id'>) => void
  updateUser: (id: string, updates: Partial<UserItem>) => void
  deleteUser: (id: string) => void
}

const defaultPermissions: PermissionsMapping = {
  Admin: {
    meal_item: { add: true, change: true, delete: true, view: true },
    meal_package: { add: true, change: true, delete: true, view: true },
    promotion: { add: true, change: true, delete: true, view: true },
    customer: { add: true, change: true, delete: true, view: true },
    orders: { add: true, change: true, delete: true, view: true },
    customer_feedback: { add: true, change: true, delete: true, view: true },
    payment_record: { add: true, change: true, delete: true, view: true },
    complaints: { add: true, change: true, delete: true, view: true },
    meal_report: { add: true, change: true, delete: true, view: true },
    logs: { add: true, change: true, delete: true, view: true },
    supplier: { add: true, change: true, delete: true, view: true },
    inventory_item: { add: true, change: true, delete: true, view: true },
    low_stock_threshold: { add: true, change: true, delete: true, view: true },
    re_stock: { add: true, change: true, delete: true, view: true },
    re_stock_history: { add: true, change: true, delete: true, view: true },
    supply_request: { add: true, change: true, delete: true, view: true },
    inventory_report: { add: true, change: true, delete: true, view: true },
    system_settings: { add: true, change: true, delete: true, view: true },
    permission_assign: { add: true, change: true, delete: true, view: true },
    role: { add: true, change: true, delete: true, view: true },
    staff: { add: true, change: true, delete: true, view: true },
    analysis_report: { add: true, change: true, delete: true, view: true },
    recovery_account: { add: true, change: true, delete: true, view: true },
  },
  'Catering Manager': {
    meal_item: { add: true, change: true, delete: true, view: true },
    meal_package: { add: true, change: true, delete: true, view: true },
    promotion: { add: true, change: true, delete: true, view: true },
    customer: { add: false, change: false, delete: false, view: false },
    orders: { add: true, change: true, delete: true, view: true },
    customer_feedback: { add: false, change: false, delete: false, view: false },
    payment_record: { add: false, change: false, delete: false, view: false },
    complaints: { add: false, change: false, delete: false, view: false },
    meal_report: { add: false, change: false, delete: false, view: true },
    logs: { add: false, change: false, delete: false, view: false },
    supplier: { add: false, change: false, delete: false, view: false },
    inventory_item: { add: false, change: false, delete: false, view: false },
    low_stock_threshold: { add: false, change: false, delete: false, view: false },
    re_stock: { add: false, change: false, delete: false, view: false },
    re_stock_history: { add: false, change: false, delete: false, view: false },
    supply_request: { add: false, change: false, delete: false, view: false },
    inventory_report: { add: false, change: false, delete: false, view: false },
    system_settings: { add: false, change: false, delete: false, view: false },
    permission_assign: { add: false, change: false, delete: false, view: false },
    role: { add: false, change: false, delete: false, view: false },
    staff: { add: false, change: false, delete: false, view: false },
    analysis_report: { add: false, change: false, delete: false, view: false },
    recovery_account: { add: false, change: false, delete: false, view: false },
  },
  'Inventory Manager': {
    meal_item: { add: false, change: false, delete: false, view: false },
    meal_package: { add: false, change: false, delete: false, view: false },
    promotion: { add: false, change: false, delete: false, view: false },
    customer: { add: false, change: false, delete: false, view: false },
    orders: { add: false, change: false, delete: false, view: false },
    customer_feedback: { add: false, change: false, delete: false, view: false },
    payment_record: { add: false, change: false, delete: false, view: false },
    complaints: { add: false, change: false, delete: false, view: false },
    meal_report: { add: false, change: false, delete: false, view: false },
    logs: { add: false, change: false, delete: false, view: false },
    supplier: { add: true, change: true, delete: true, view: true },
    inventory_item: { add: true, change: true, delete: true, view: true },
    low_stock_threshold: { add: true, change: true, delete: true, view: true },
    re_stock: { add: true, change: true, delete: true, view: true },
    re_stock_history: { add: true, change: true, delete: true, view: true },
    supply_request: { add: true, change: true, delete: true, view: true },
    inventory_report: { add: true, change: true, delete: true, view: true },
    system_settings: { add: false, change: false, delete: false, view: false },
    permission_assign: { add: false, change: false, delete: false, view: false },
    role: { add: false, change: false, delete: false, view: false },
    staff: { add: false, change: false, delete: false, view: false },
    analysis_report: { add: false, change: false, delete: false, view: false },
    recovery_account: { add: false, change: false, delete: false, view: false },
  },
}

const defaultRoles: RoleItem[] = [
  { name: 'Admin', description: 'Full system access' },
  { name: 'Catering Manager', description: 'Meal & order management' },
  { name: 'Inventory Manager', description: 'Stock & supplier management' },
]

const defaultUsers: UserItem[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@7daymeals.lk',
    role: 'Admin',
    isActive: true,
  },
  {
    id: 'u2',
    name: 'Catering Mgr',
    email: 'catering@7daymeals.lk',
    role: 'Catering Manager',
    isActive: true,
  },
  {
    id: 'u3',
    name: 'Inventory Mgr',
    email: 'inventory@7daymeals.lk',
    role: 'Inventory Manager',
    isActive: true,
  },
  {
    id: 'u4',
    name: 'Kamal Perera',
    email: 'kamal@7daymeals.lk',
    role: 'Catering Manager',
    isActive: false,
  },
]

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      permissions: defaultPermissions,
      rolesList: defaultRoles,
      usersList: defaultUsers,
      updateRolePermissions: (role: Role, permissions: RolePermissions) =>
        set((state) => ({
          permissions: {
            ...state.permissions,
            [role]: permissions,
          },
        })),
      addRole: (role: RoleItem) =>
        set((state) => ({
          rolesList: [...state.rolesList, role],
          permissions: {
            ...state.permissions,
            [role.name]: {},
          },
        })),
      updateRole: (name: string, updates: Partial<RoleItem>) =>
        set((state) => {
          const updatedRoles = state.rolesList.map((r) =>
            r.name === name ? { ...r, ...updates } : r
          )
          const updatedPermissions = { ...state.permissions }
          if (updates.name && updates.name !== name) {
            updatedPermissions[updates.name] = updatedPermissions[name] || {}
            delete updatedPermissions[name]
          }
          return {
            rolesList: updatedRoles,
            permissions: updatedPermissions,
            usersList: state.usersList.map((u) =>
              u.role === name ? { ...u, role: updates.name || u.role } : u
            ),
          }
        }),
      deleteRole: (name: string) =>
        set((state) => {
          const updatedPermissions = { ...state.permissions }
          delete updatedPermissions[name]
          return {
            rolesList: state.rolesList.filter((r) => r.name !== name),
            permissions: updatedPermissions,
          }
        }),
      addUser: (user: Omit<UserItem, 'id'>) =>
        set((state) => ({
          usersList: [
            ...state.usersList,
            { ...user, id: `u_${Date.now()}` },
          ],
        })),
      updateUser: (id: string, updates: Partial<UserItem>) =>
        set((state) => ({
          usersList: state.usersList.map((u) =>
            u.id === id ? { ...u, ...updates } : u
          ),
        })),
      deleteUser: (id: string) =>
        set((state) => ({
          usersList: state.usersList.filter((u) => u.id !== id),
        })),
    }),
    {
      name: '7day-meals-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
