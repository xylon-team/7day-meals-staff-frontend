import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const USER_STORAGE_KEY = '7day-meals-user-storage'
const REMEMBER_ME_KEY = '7day-meals-remember-staff-session'

const getSelectedStorage = () => {
  if (typeof window === 'undefined') return undefined
  return window.localStorage.getItem(REMEMBER_ME_KEY) === 'false'
    ? window.sessionStorage
    : window.localStorage
}

const userStorage = {
  getItem: (name: string) => getSelectedStorage()?.getItem(name) ?? null,
  setItem: (name: string, value: string) => {
    const selectedStorage = getSelectedStorage()
    if (!selectedStorage || typeof window === 'undefined') return
    const otherStorage = selectedStorage === window.localStorage ? window.sessionStorage : window.localStorage
    selectedStorage.setItem(name, value)
    otherStorage.removeItem(name)
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(name)
    window.sessionStorage.removeItem(name)
  },
}

export type Role = string

export interface User {
  id?: number | string
  username: string
  name: string
  role: Role
  displayRole?: string
  accessToken?: string
  phone?: string
  /**
   * Flat list of permission_type strings fetched from the backend after login.
   * e.g. ["inventory_item_add", "inventory_item_view", "supplier_view"]
   * Undefined means permissions haven't been loaded yet (treat as no restrictions for Admins).
   */
  permissions?: string[]
}

interface UserStoreState {
  user: User | null
  hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  login: (username: string, role: string, accessToken?: string, id?: number | string, name?: string, rememberMe?: boolean) => void
  logout: () => void
  updateProfile: (name: string, username: string, phone?: string) => void
  updateStaffIdentity: (name: string, displayRole: string, username: string, phone?: string) => void
  setPermissions: (permissions: string[]) => void
  setAccessToken: (accessToken: string) => void
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
      login: (username: string, role: string, accessToken?: string, id?: number | string, name?: string, rememberMe = true) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe))
          // Clear any previous session copy so login respects the new checkbox choice.
          window.localStorage.removeItem(USER_STORAGE_KEY)
          window.sessionStorage.removeItem(USER_STORAGE_KEY)
        }
        set({
          user: {
            id,
            username,
            name: name || (
              role === 'Admin'
                ? 'Admin User'
                : role === 'Catering Manager'
                  ? 'Catering Manager'
                  : 'Inventory Manager'
            ),
            role: role as Role,
            accessToken,
          },
        })
      },
      logout: () => set({ user: null }),
      updateProfile: (name: string, username: string, phone?: string) =>
        set((state) => ({
          user: state.user
            ? {
              ...state.user,
              name,
              username,
              phone: phone !== undefined ? phone : state.user.phone,
            }
            : null,
        })),
      updateStaffIdentity: (name, displayRole, username, phone) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, name, displayRole, username, phone: phone !== undefined ? phone : state.user.phone }
            : null,
        })),
      setPermissions: (permissions: string[]) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, permissions }
            : null,
        })),
      setAccessToken: (accessToken: string) =>
        set((state) => ({
          user: state.user ? { ...state.user, accessToken } : null,
        })),
    }),
    {
      name: '7day-meals-user-storage',
      storage: createJSONStorage(() => userStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
