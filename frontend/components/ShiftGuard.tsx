'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type Role = 'owner' | 'admin' | 'cashier' | 'kitchen'

const access: Record<Role, string[]> = {
  owner: ['/admin', '/audit', '/cashier', '/history', '/kitchen', '/shift', '/waiting', '/done'],
  admin: ['/admin', '/audit', '/cashier', '/history', '/kitchen', '/shift', '/waiting', '/done'],
  cashier: ['/cashier', '/history', '/shift', '/waiting', '/done'],
  kitchen: ['/kitchen', '/waiting', '/done'],
}

export default function ShiftGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!pathname) return
    const isPublic = ['/login', '/menu', '/qr', '/receipt', '/waiting', '/done'].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
    if (isPublic) return

    let cancelled = false
    async function verifyAccess() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!response.ok) throw new Error('Unauthenticated')
        const { user } = await response.json()
        if (cancelled) return
        const allowed = access[user.role as Role]?.some(
          (path) => pathname === path || pathname.startsWith(`${path}/`),
        )
        if (!allowed && pathname !== '/') {
          router.replace(user.role === 'kitchen' ? '/kitchen' : user.role === 'cashier' ? '/cashier' : '/admin')
          return
        }
        if (pathname === '/') {
          router.replace(user.role === 'kitchen' ? '/kitchen' : user.role === 'cashier' ? '/cashier' : '/admin')
        }
      } catch {
        if (!cancelled) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      }
    }
    void verifyAccess()
    return () => { cancelled = true }
  }, [pathname, router])

  return null
}
