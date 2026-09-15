'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { apiRequest } from '@/lib/client-api'
import type { StaffProfile } from '@/lib/types'

type MeResponse = {
  staff: StaffProfile | null
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [staff, setStaff] = useState<StaffProfile | null>(null)

  const hidden =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/access') ||
    pathname.startsWith('/menu') ||
    pathname.startsWith('/waiting') ||
    pathname.startsWith('/receipt') ||
    pathname.startsWith('/done')

  useEffect(() => {
    if (hidden) return

    let active = true
    const timer = window.setTimeout(() => {
      apiRequest<MeResponse>('/api/auth/me')
        .then((data) => {
          if (active) setStaff(data.staff)
        })
        .catch(() => {
          if (active) setStaff(null)
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [hidden, pathname])

  if (hidden) return null

  const links = [
    ...(staff?.role === 'owner' || staff?.role === 'kitchen'
      ? [{ href: '/kitchen', label: 'Dapur' }]
      : []),
    ...(staff?.role === 'owner' || staff?.role === 'cashier'
      ? [
          { href: '/cashier', label: 'Kasir' },
          { href: '/shift', label: 'Shift' },
          { href: '/history', label: 'Riwayat' },
        ]
      : []),
    ...(staff?.role === 'owner'
      ? [{ href: '/admin', label: 'Admin' }]
      : []),
  ]

  const signOut = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(
      () => null,
    )
    router.replace('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-3">
        <Link
          href="/"
          className="mr-auto whitespace-nowrap text-xl font-black text-orange-400"
        >
          KASIR DIGITAL
        </Link>
        <nav className="flex items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-black'
                  : 'rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800'
              }
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={signOut}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300"
          >
            Keluar
          </button>
        </nav>
      </div>
    </header>
  )
}
