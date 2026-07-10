export interface AdminLoginRequest {
  admin_username?: string
  admin_password?: string
}

export interface AdminLoginResponse {
  access_token: string
}
