export interface User {
  id: string
  email: string
  name: string
  registrationDate: string
  verified: boolean
  verificationCode?: string
  verificationExpires?: string
  referredBy?: string
}

export interface VerificationResult {
  success: boolean
  message: string
  user?: User
}
