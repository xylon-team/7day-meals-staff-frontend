import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  email: string
  name: string
  role: 'Admin' | 'Catering Manager' | 'Inventory Manager'
}

interface StoreState {
  user: User | null
  login: (email: string, role: string) => void
  logout: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      login: (email: string, role: string) =>
        set({
          user: {
            email,
            name: role === 'Admin' ? 'Admin User' : role === 'Catering Manager' ? 'Catering Manager' : 'Inventory Manager',
            role: role as 'Admin' | 'Catering Manager' | 'Inventory Manager',
          },
        }),
      logout: () => set({ user: null }),
    }),
    {
      name: '7day-meals-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
