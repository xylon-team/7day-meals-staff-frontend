'use client'

import React, { useState } from 'react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Server,
  Users,
  Database,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useUserStore } from '@/store/user-store'
import { adminLogin } from '@/lib/api/login'

export function AdminLogin() {
  const router = useRouter()
  const { login } = useUserStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await adminLogin({
        admin_username: username,
        admin_password: password
      })

      login(username, 'Admin', data.access_token)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillCredentials = () => {
    setUsername('admin')
    setPassword('Admin@7DM2024')
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Left Branding Panel - Admin Themed */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-8 shadow-lg">
            <ShieldAlert size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Admin Portal</h1>
          <p className="text-white/60 text-xl mb-12">
            Secure System Administration
          </p>

          <div className="space-y-6 w-full text-left">
            <div className="flex items-center gap-4 text-white/80 bg-white/5 p-4 rounded-card border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
              <Server size={24} className="text-white shrink-0" />
              <span className="font-medium">System Configuration</span>
            </div>
            <div className="flex items-center gap-4 text-white/80 bg-white/5 p-4 rounded-card border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
              <Users
                size={24}
                className="text-white shrink-0"
              />
              <span className="font-medium">User Management</span>
            </div>
            <div className="flex items-center gap-4 text-white/80 bg-white/5 p-4 rounded-card border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
              <Database size={24} className="text-white shrink-0" />
              <span className="font-medium">Data Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-card p-8 rounded-card shadow-card border border-line relative">
          
          <button 
            onClick={() => router.push('/login')} 
            className="absolute -top-12 left-0 text-ink-soft hover:text-ink flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Back to Staff Login
          </button>

          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <ShieldAlert size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2 text-center lg:text-left">
            Administrator Access
          </h2>
          <p className="text-ink-soft mb-8 text-center lg:text-left">
            Sign in to access system controls
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Admin Username
              </label>
              <Input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                icon={<Mail size={18} />}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-ink">
                  Security Key / Password
                </label>
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

            {error && (
              <div className="p-3 bg-danger-bg border border-danger-fg/20 rounded-control text-sm text-danger-fg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Authenticate'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-line">
            <p className="text-xs text-center text-ink-soft mb-4 uppercase tracking-wider font-semibold">
              Demo Admin Account
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={fillCredentials}
                className="hover:opacity-80 transition-opacity"
              >
                <Badge variant="info">System Administrator</Badge>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
