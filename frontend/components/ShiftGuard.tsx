'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function ShiftGuard() {
  const pathname = usePathname()
  const router = useRouter()
  const checkedRef = useRef(false)

  useEffect(() => {
    // Only run on client and only once per navigation
    if (!pathname) return
    if (checkedRef.current) return

    // customer routes that should remain accessible
    const publicPaths = ['/menu', '/qr']

    // protected POS routes
    const protectedPrefixes = [
      '/cashier',
      '/kitchen',
      '/waiting',
      '/done',
      '/',
    ]

    // if current path is public or receipt or admin, skip check
    if (pathname.startsWith('/receipt')) return
    if (publicPaths.some((p) => pathname.startsWith(p))) return

    const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))

    if (!isProtected) return

    checkedRef.current = true

    ;(async () => {
      try {
        const res = await fetch('http://localhost:3001/api/shifts/active', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()

          // if no active shift (null/undefined/empty), redirect to /shift
          if (!data) {
            router.replace('/shift')
          }
        } else {
          // on non-ok, conservatively redirect to shift
          router.replace('/shift')
        }
      } catch (err) {
        // network or other error: redirect to shift to be safe
        try {
          router.replace('/shift')
        } catch (e) {}
      }
    })()
  }, [pathname, router])

  return null
}
