import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Role = string

export interface User {
  username: string
  name: string
  role: Role
  accessToken?: string
}

interface UserStoreState {
  user: User | null
  login: (username: string, role: string, accessToken?: string) => void
  logout: () => void
  updateProfile: (name: string, username: string) => void
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      user: null,
      login: (username: string, role: string, accessToken?: string) =>
        set({
          user: {
            username,
            name:
              role === 'Admin'
                ? 'Admin User'
                : role === 'Catering Manager'
                ? 'Catering Manager'
                : 'Inventory Manager',
            role: role as Role,
            accessToken,
          },
        }),
      logout: () => set({ user: null }),
      updateProfile: (name: string, username: string) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                name,
                username,
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
