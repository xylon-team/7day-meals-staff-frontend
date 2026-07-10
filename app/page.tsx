'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUserStore } from '@/store/user-store'
import Login from '@/pages/login/page'

export default function Home() {
  const router = useRouter()
  const { user } = useUserStore()

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  // If not logged in, show login page
  if (!user) {
    return <Login />
  }

  return null
}
