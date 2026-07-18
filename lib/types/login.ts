export interface AdminLoginRequest {
  admin_username?: string
  admin_password?: string
}

export interface AdminLoginResponse {
  access_token: string
}

export interface StaffLoginRequest {
  email?: string
  staff_password?: string
}

export interface StaffLoginResponse {
  access_token: string
}
