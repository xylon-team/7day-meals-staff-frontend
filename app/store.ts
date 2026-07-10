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
    meal_management: { add: true, change: true, delete: true, view: true },
    view_meals: { add: true, change: true, delete: true, view: true },
    create_meals: { add: true, change: true, delete: true, view: true },
    edit_meals: { add: true, change: true, delete: true, view: true },
    delete_meals: { add: true, change: true, delete: true, view: true },
    order_management: { add: true, change: true, delete: true, view: true },
    view_orders: { add: true, change: true, delete: true, view: true },
    update_order_status: { add: true, change: true, delete: true, view: true },
    cancel_order: { add: true, change: true, delete: true, view: true },
    inventory_management: { add: true, change: true, delete: true, view: true },
    view_inventory: { add: true, change: true, delete: true, view: true },
    add_inventory: { add: true, change: true, delete: true, view: true },
    staff_management: { add: true, change: true, delete: true, view: true },
    view_staff: { add: true, change: true, delete: true, view: true },
    manage_salary: { add: true, change: true, delete: true, view: true },
    view_reports: { add: true, change: true, delete: true, view: true },
    export_reports: { add: true, change: true, delete: true, view: true },
    view_logs: { add: true, change: true, delete: true, view: true },
    manage_settings: { add: true, change: true, delete: true, view: true },
    manage_users: { add: true, change: true, delete: true, view: true },
  },
  'Catering Manager': {
    meal_management: { add: true, change: true, delete: true, view: true },
    view_meals: { add: false, change: false, delete: false, view: true },
    create_meals: { add: true, change: false, delete: false, view: true },
    edit_meals: { add: false, change: true, delete: false, view: true },
    delete_meals: { add: false, change: false, delete: true, view: true },
    order_management: { add: true, change: true, delete: true, view: true },
    view_orders: { add: false, change: false, delete: false, view: true },
    update_order_status: { add: false, change: true, delete: false, view: true },
    cancel_order: { add: false, change: false, delete: true, view: true },
    inventory_management: { add: false, change: false, delete: false, view: false },
    view_inventory: { add: false, change: false, delete: false, view: false },
    add_inventory: { add: false, change: false, delete: false, view: false },
    staff_management: { add: false, change: true, delete: false, view: true },
    view_staff: { add: false, change: false, delete: false, view: true },
    manage_salary: { add: true, change: true, delete: false, view: true },
    view_reports: { add: false, change: false, delete: false, view: true },
    export_reports: { add: false, change: false, delete: false, view: false },
    view_logs: { add: false, change: false, delete: false, view: false },
    manage_settings: { add: false, change: false, delete: false, view: false },
    manage_users: { add: false, change: false, delete: false, view: false },
  },
  'Inventory Manager': {
    meal_management: { add: false, change: false, delete: false, view: true },
    view_meals: { add: false, change: false, delete: false, view: true },
    create_meals: { add: false, change: false, delete: false, view: true },
    edit_meals: { add: false, change: false, delete: false, view: true },
    delete_meals: { add: false, change: false, delete: false, view: true },
    order_management: { add: false, change: false, delete: false, view: true },
    view_orders: { add: false, change: false, delete: false, view: true },
    update_order_status: { add: false, change: false, delete: false, view: true },
    cancel_order: { add: false, change: false, delete: false, view: true },
    inventory_management: { add: true, change: true, delete: true, view: true },
    view_inventory: { add: false, change: false, delete: false, view: true },
    add_inventory: { add: true, change: false, delete: false, view: true },
    staff_management: { add: false, change: false, delete: false, view: false },
    view_staff: { add: false, change: false, delete: false, view: false },
    manage_salary: { add: false, change: false, delete: false, view: false },
    view_reports: { add: false, change: false, delete: false, view: true },
    export_reports: { add: false, change: false, delete: false, view: true },
    view_logs: { add: false, change: false, delete: false, view: true },
    manage_settings: { add: false, change: false, delete: false, view: false },
    manage_users: { add: false, change: false, delete: false, view: false },
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
