import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Role = string

export interface User {
  id?: number | string
  username: string
  name: string
  role: Role
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
  login: (username: string, role: string, accessToken?: string, id?: number | string, name?: string) => void
  logout: () => void
  updateProfile: (name: string, username: string, phone?: string) => void
  setPermissions: (permissions: string[]) => void
  setAccessToken: (accessToken: string) => void
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
      login: (username: string, role: string, accessToken?: string, id?: number | string, name?: string) =>
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
        }),
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
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
