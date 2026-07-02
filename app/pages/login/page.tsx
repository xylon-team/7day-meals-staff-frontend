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

import { Badge } from '@/app/components/Badge'
import { Button } from '@/app/components/Button'
import { Input } from '@/app/components/Input'
import { useStore } from '@/app/store'

type Role = 'Admin' | 'Catering Manager' | 'Inventory Manager'

export function Login() {
  const router = useRouter()
  const { login } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    // Mock authentication based on provided credentials
    if (email === 'admin@7daymeals.lk' && password === 'Admin@7DM2024') {
      login(email, 'Admin')
      router.push('/dashboard')
    } else if (
      email === 'catering@7daymeals.lk' &&
      password === 'Catering@7DM2024'
    ) {
      login(email, 'Catering Manager')
      router.push('/dashboard')
    } else if (
      email === 'inventory@7daymeals.lk' &&
      password === 'Inventory@7DM2024'
    ) {
      login(email, 'Inventory Manager')
      router.push('/dashboard')
    } else {
      setError('Invalid email or password')
    }
  }

  const fillCredentials = (role: Role) => {
    if (role === 'Admin') {
      setEmail('admin@7daymeals.lk')
      setPassword('Admin@7DM2024')
    } else if (role === 'Catering Manager') {
      setEmail('catering@7daymeals.lk')
      setPassword('Catering@7DM2024')
    } else if (role === 'Inventory Manager') {
      setEmail('inventory@7daymeals.lk')
      setPassword('Inventory@7DM2024')
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
                <a
                  href="#"
                  className="text-xs text-primary hover:text-primary-dark font-medium"
                >
                  Forgot Password?
                </a>
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

            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-line">
            <p className="text-xs text-center text-ink-soft mb-4 uppercase tracking-wider font-semibold">
              Demo Accounts
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => fillCredentials('Admin')}
                className="hover:opacity-80 transition-opacity"
              >
                <Badge variant="info">Admin</Badge>
              </button>
              <button
                onClick={() => fillCredentials('Catering Manager')}
                className="hover:opacity-80 transition-opacity"
              >
                <Badge variant="warning">Catering Manager</Badge>
              </button>
              <button
                onClick={() => fillCredentials('Inventory Manager')}
                className="hover:opacity-80 transition-opacity"
              >
                <Badge variant="success">Inventory Manager</Badge>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
