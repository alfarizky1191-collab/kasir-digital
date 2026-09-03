'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type User = { name: string; role: 'owner' | 'admin' | 'cashier' | 'kitchen' }

const menus = [
  { name: 'Admin', href: '/admin', roles: ['owner', 'admin'] },
  { name: 'Menu', href: '/admin/products', roles: ['owner', 'admin'] },
  { name: 'Laporan', href: '/admin/reports', roles: ['owner', 'admin'] },
  { name: 'Pengguna', href: '/admin/users', roles: ['owner'] },
  { name: 'Dapur', href: '/kitchen', roles: ['owner', 'admin', 'kitchen'] },
  { name: 'Kasir', href: '/cashier', roles: ['owner', 'admin', 'cashier'] },
  { name: 'Shift', href: '/shift', roles: ['owner', 'admin', 'cashier'] },
] as const

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const hidden = ['/menu', '/receipt', '/login'].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )

  useEffect(() => {
    if (hidden) return
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setUser(result?.user || null))
      .catch(() => setUser(null))
  }, [hidden, pathname])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  if (hidden) return null

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-4">
        <h1 className="mr-auto min-w-fit text-xl font-black text-white md:text-2xl">NOIR POS</h1>
        {user ? menus.filter((menu) => (menu.roles as readonly string[]).includes(user.role)).map((menu) => (
          <Link key={menu.href} href={menu.href} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${pathname === menu.href ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-300'}`}>
            {menu.name}
          </Link>
        )) : null}
        {user ? (
          <button onClick={logout} title={`Keluar sebagai ${user.name}`} className="whitespace-nowrap rounded-xl border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-300">
            Keluar
          </button>
        ) : null}
      </div>
    </nav>
  )
}
