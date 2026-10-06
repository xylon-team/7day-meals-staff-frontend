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
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { forgotPassword, verifyOtp, resetPassword } from '@/lib/api/forgot-password'

export function ForgotPassword() {
  const router = useRouter()
  
  // Step 1: Email, Step 2: OTP, Step 3: New Password
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await forgotPassword(email)
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await verifyOtp(email, otp)
      setStep(3)
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    
    setIsLoading(true)
    try {
      await resetPassword(email, otp, newPassword)
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.')
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

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-card p-8 rounded-card shadow-card border border-line">
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Utensils size={32} className="text-white" />
            </div>
          </div>

          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-ink mb-2 text-center lg:text-left">
                Forgot Password?
              </h2>
              <p className="text-ink-soft mb-8 text-center lg:text-left">
                Enter your staff email. If an account exists, we’ll send a password reset OTP.
              </p>

              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="name@7daymeals.lk"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-danger-bg border border-danger-fg/20 rounded-control text-sm text-danger-fg">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Button>

                <div className="mt-6 text-center">
                  <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                    <ArrowLeft size={16} />
                    Back to login
                  </Link>
                </div>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-success-fg" />
                </div>
                <h2 className="text-2xl font-bold text-ink mb-2 text-center">
                  Check your inbox
                </h2>
                <p className="text-ink-soft text-center px-4">
                  If a staff account exists for this email, a password reset OTP will be sent to
                  <br />
                  <span className="font-semibold text-ink">{email || '{entered email}'}</span>
                  <br />
                  Follow the instructions to set a new password.
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <Input
                    type="text"
                    placeholder="Type the OTP"
                    value={otp}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                    className="text-center tracking-widest"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-danger-bg border border-danger-fg/20 rounded-control text-sm text-danger-fg">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify the OTP'}
                </Button>

                <div className="mt-6 text-center">
                  <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                    <ArrowLeft size={16} />
                    Back to login
                  </Link>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold text-ink mb-2 text-center lg:text-left">
                Set a new password
              </h2>
              <p className="text-ink-soft mb-8 text-center lg:text-left">
                Choose a strong password for your staff account.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
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

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-danger-bg border border-danger-fg/20 rounded-control text-sm text-danger-fg">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <div className="mt-6 text-center">
                  <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                    <ArrowLeft size={16} />
                    Back to login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
