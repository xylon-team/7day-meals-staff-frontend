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
}

interface UserStoreState {
  user: User | null
  login: (username: string, role: string, accessToken?: string, id?: number | string, name?: string) => void
  logout: () => void
  updateProfile: (name: string, username: string, phone?: string) => void
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      user: null,
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
    }),
    {
      name: '7day-meals-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
