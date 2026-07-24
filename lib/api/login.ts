import { AdminLoginRequest, AdminLoginResponse, StaffLoginRequest, StaffLoginResponse } from '../types/login'

export const adminLogin = async (data: AdminLoginRequest): Promise<AdminLoginResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Access Denied. Invalid administrator credentials.')
  }

  const responseData = await response.json()

  if (!responseData.access_token) {
    throw new Error('Access Denied. Invalid administrator credentials.')
  }

  return responseData
}

export const staffLogin = async (data: StaffLoginRequest): Promise<StaffLoginResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/staff-auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'The email address or password you entered is incorrect.')
  }

  const responseData = await response.json()

  if (!responseData.access_token) {
    throw new Error('Access Denied. Invalid staff credentials.')
  }

  return responseData
}
