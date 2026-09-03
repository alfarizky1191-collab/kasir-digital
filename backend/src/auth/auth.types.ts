export const ROLES = ['owner', 'admin', 'cashier', 'kitchen'] as const
export type Role = (typeof ROLES)[number]

export type SessionUser = {
  id: string
  username: string
  name: string
  role: Role
}
