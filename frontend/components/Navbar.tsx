'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menus = [
  {
    name: 'Menu',
    href: '/menu',
  },
  {
    name: 'Kitchen',
    href: '/kitchen',
  },
  {
    name: 'Cashier',
    href: '/cashier',
  },
  {
    name: 'Shift',
    href: '/shift',
  },
  // Backoffice links hidden from POS navbar
]

export default function Navbar() {
  const pathname = usePathname()
  const isCustomerMenu = pathname.startsWith('/menu')

  // hide navbar for receipt printing pages and customer menu ordering
  if (isCustomerMenu || pathname.startsWith('/receipt')) {
    return null
  }

  return (
    <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="min-w-fit">
          <h1 className="text-xl md:text-2xl font-black text-white">
            NOIR POS
          </h1>
        </div>

        <div className="flex items-center gap-2 min-w-fit">
          {menus.map((menu) => {
            const active =
              pathname === menu.href

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`px-4 py-2 rounded-2xl text-sm md:text-base font-bold whitespace-nowrap transition ${
                  active
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {menu.name}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
