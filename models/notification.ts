export interface Notification {
  id: string
  type: "registration" | "verification" | "system"
  title: string
  message: string
  email?: string
  read: boolean
  createdAt: string
}
