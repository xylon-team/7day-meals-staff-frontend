'use client'

import React, { useState } from 'react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Utensils,
  ShieldCheck,
  PackageSearch,
  ChefHat,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useUserStore } from '@/store/user-store'
import { staffLogin } from '@/lib/api/login'
import { getMyStaffProfile, getStaffPermissions } from '@/lib/api/staff'

const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export function Login() {
  const router = useRouter()
  const { login, logout, updateStaffIdentity, setPermissions } = useUserStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await staffLogin({
        email: email,
        staff_password: password
      })

      const decoded = decodeJwt(data.access_token)
      const staffId = decoded?.sub

      // Keep the authorization role distinct from role labels on the staff record.
      login(email, 'Staff', data.access_token, staffId, 'Staff Member', rememberMe)

      try {
        const profile = await getMyStaffProfile(data.access_token)
        const displayName = [profile.fname, profile.lname].filter(Boolean).join(' ') || 'Staff Member'
        updateStaffIdentity(displayName, profile.role || 'Staff', profile.email || email, profile.phone_number)
      } catch (profileError) {
        logout()
        throw new Error(profileError instanceof Error
          ? `Signed in, but failed to load your staff profile: ${profileError.message}`
          : 'Signed in, but failed to load your staff profile.')
      }

      // Permissions load in the background; the layout handles their loading state.
      if (staffId) {
        getStaffPermissions(staffId)
          .then((perms) => setPermissions(perms))
          .catch((err) => console.warn('Could not load staff permissions:', err))
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-8 shadow-lg">
            <Utensils size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">7Day Meals</h1>
          <p className="text-primary-light text-xl mb-12">
            Manage. Monitor. Deliver.
          </p>

          <div className="space-y-6 w-full text-left">
            <div className="flex items-center gap-4 text-white/80 bg-white/5 p-4 rounded-card border border-white/10">
              <ShieldCheck size={24} className="text-primary-light shrink-0" />
              <span className="font-medium">Role-Based Access Control</span>
            </div>
            <div className="flex items-center gap-4 text-white/80 bg-white/5 p-4 rounded-card border border-white/10">
              <PackageSearch
                size={24}
                className="text-primary-light shrink-0"
              />
              <span className="font-medium">Real-Time Inventory Tracking</span>
            </div>
            <div className="flex items-center gap-4 text-white/80 bg-white/5 p-4 rounded-card border border-white/10">
              <ChefHat size={24} className="text-primary-light shrink-0" />
              <span className="font-medium">Complete Meal Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-card p-8 rounded-card shadow-card border border-line">
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Utensils size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2 text-center lg:text-left">
            Welcome Back
          </h2>
          <p className="text-ink-soft mb-8 text-center lg:text-left">
            Sign in to your staff account
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="name@7daymeals.lk"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                icon={<Mail size={18} />}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-ink">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary-dark font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  icon={<Lock size={18} />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-ink-soft"
              >
                Remember me
              </label>
            </div>

            {error && (
              <div className="p-3 bg-danger-bg border border-danger-fg/20 rounded-control text-sm text-danger-fg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => router.push('/admin-login')}
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Login as Administrator &rarr;
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-line">
            <p className="text-sm text-center text-ink-soft">
              Sign in with the staff credentials provided by your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
