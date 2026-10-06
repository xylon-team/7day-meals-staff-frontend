'use client'

import React, { useState, useEffect } from 'react'
import { User as UserIcon, Mail as MailIcon, Phone as PhoneIcon, Lock as LockIcon, Check, Eye, EyeOff } from 'lucide-react'
import { useUserStore } from '@/store/user-store'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { getStaff, getStaffById, updateStaff, changeOwnStaffPassword } from '@/lib/api/staff'
import { withTimeout } from '@/lib/utils/with-timeout'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export function Profile() {
  const { user, updateProfile } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [staffId, setStaffId] = useState<number | string>(user?.id || '')

  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const [originalData, setOriginalData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  useEffect(() => {
    if (!user) return
    let isCurrent = true

    const getFallbackProfile = (): ProfileData => {
      const nameParts = user.name.split(' ')
      return {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.username,
        phone: user.phone || '',
      }
    }

    const loadProfile = async () => {
      try {
        const profileRequest = (async (): Promise<{ id: number | string; data: ProfileData } | null> => {
          let currentStaff = null
          if (user.id) {
            try {
              currentStaff = await getStaffById(user.id)
            } catch (e) {
              console.warn('Failed to load profile by ID, trying email fallback', e)
            }
          }

          if (!currentStaff) {
            try {
              const staffList = await getStaff()
              currentStaff = staffList.find(
                (s) => s.id === Number(user.id) || s.email?.toLowerCase() === user.username.toLowerCase()
              )
            } catch (e) {
              console.warn('Failed to load staff list fallback', e)
            }
          }

          return currentStaff ? {
            id: currentStaff.id,
            data: {
              firstName: currentStaff.fname,
              lastName: currentStaff.lname,
              email: currentStaff.email || user.username,
              phone: currentStaff.phone_number || '',
            },
          } : null
        })()

        const profile = await withTimeout(profileRequest, 5000, 'Profile request timed out')
        if (isCurrent) {
          if (profile) {
            setStaffId(profile.id)
            setFormData(profile.data)
            setOriginalData(profile.data)
          } else {
            const fallbackData = getFallbackProfile()
            setFormData(fallbackData)
            setOriginalData(fallbackData)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch profile details, using user store fallbacks:', error)
        if (isCurrent) {
          const fallbackData = getFallbackProfile()
          setFormData(fallbackData)
          setOriginalData(fallbackData)
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadProfile()
    return () => {
      isCurrent = false
    }
  }, [user])

  if (!user) {
    return null
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData(originalData)
    setErrors({})
  }

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    
    const phoneTrimmed = formData.phone.trim()
    if (!phoneTrimmed) {
      newErrors.phone = 'Phone number is required'
    } else {
      const phoneRegex = /^(?:\+94|0)?7[0-9]{8}$/
      if (!phoneRegex.test(phoneTrimmed)) {
        newErrors.phone = 'Enter a valid Sri Lankan phone number (e.g. +94771234567 or 0771234567)'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const activeId = staffId || user?.id
      if (activeId) {
        await updateStaff(activeId, {
          fname: formData.firstName,
          lname: formData.lastName,
          email: formData.email,
          phone_number: formData.phone,
        })
      } else {
        throw new Error('User ID is missing. Cannot update profile on backend.')
      }
      
      // Update global user store state
      const fullName = `${formData.firstName} ${formData.lastName}`
      updateProfile(fullName, formData.email, formData.phone)

      setOriginalData(formData)
      setIsEditing(false)
      setErrors({})
      showToast('Profile updated successfully')
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile')
    }
  }

  const handlePasswordUpdate = async () => {
    const newErrors: Record<string, string> = {}
    if (!passwordData.currentPassword)
      newErrors.currentPassword = 'Current password is required'
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
      if (!passwordRegex.test(passwordData.newPassword)) {
        newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await changeOwnStaffPassword(passwordData.currentPassword, passwordData.newPassword)
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setErrors({})
      showToast('Password updated successfully')
    } catch (err: any) {
      showToast(err.message || 'Failed to update password')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-card shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check size={18} />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-ink">My Profile</h1>
        <p className="text-ink-soft mt-1">
          Manage your personal information and password
        </p>
      </div>

      <div className="bg-card rounded-card p-6 border border-line shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-2xl uppercase select-none shadow-sm">
              {formData.firstName ? formData.firstName[0] : user.name[0]}
              {formData.lastName ? formData.lastName[0] : (user.name.split(' ')[1]?.[0] || '')}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">
                {formData.firstName || user.name} {formData.lastName || ''}
              </h2>
              <div className="mt-1">
                <Badge variant="info">{user.role}</Badge>
              </div>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit} variant="primary">
              Edit Profile
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-ink-soft">Loading profile details...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                First Name
              </label>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    firstName: e.target.value,
                  })
                }
                icon={<UserIcon className="w-5 h-5" />}
                disabled={!isEditing}
                error={errors.firstName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Last Name
              </label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastName: e.target.value,
                  })
                }
                icon={<UserIcon className="w-5 h-5" />}
                disabled={!isEditing}
                error={errors.lastName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                icon={<MailIcon className="w-5 h-5" />}
                disabled={!isEditing}
                error={errors.email}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Phone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value,
                  })
                }
                icon={<PhoneIcon className="w-5 h-5" />}
                disabled={!isEditing}
                error={errors.phone}
              />
            </div>
          </div>
        )}

        {isEditing && !isLoading && (
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} variant="primary">
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="ghost">
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-card p-6 border border-line shadow-card">
        <h3 className="text-lg font-semibold text-ink mb-4">
          Change Password
        </h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                className="pr-10"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                icon={<LockIcon className="w-5 h-5" />}
                error={errors.currentPassword}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-3 text-ink-soft hover:text-ink"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                className="pr-10"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                icon={<LockIcon className="w-5 h-5" />}
                error={errors.newPassword}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-ink-soft hover:text-ink"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                className="pr-10"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                icon={<LockIcon className="w-5 h-5" />}
                error={errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-ink-soft hover:text-ink"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <Button onClick={handlePasswordUpdate} variant="primary" className="mt-2">
            Update Password
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Profile
