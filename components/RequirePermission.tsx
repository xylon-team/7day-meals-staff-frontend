'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useUserStore } from '@/store/user-store'

export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const hasHydrated = useUserStore((state) => state.hasHydrated)
  const isAdmin = user?.role === 'Admin'
  const isLoadingPermissions = Boolean(user && !isAdmin && user.permissions === undefined)
  const isAllowed = isAdmin || Boolean(user?.permissions?.includes(permission))

  useEffect(() => {
    if (!hasHydrated || isLoadingPermissions) return
    if (!user) router.replace('/login')
    else if (!isAllowed) router.replace('/dashboard')
  }, [hasHydrated, isLoadingPermissions, isAllowed, router, user])

  if (!hasHydrated || isLoadingPermissions) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink-soft">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Checking permissions...
      </div>
    )
  }

  if (!user) return <div className="p-8 text-center text-ink-soft">Redirecting to sign in...</div>

  if (!isAllowed) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="mb-3 h-10 w-10 text-danger-fg" />
        <h1 className="text-xl font-semibold text-ink">Access denied</h1>
        <p className="mt-2 text-ink-soft">You don’t have permission to view this page.</p>
      </div>
    )
  }

  return <>{children}</>
}
