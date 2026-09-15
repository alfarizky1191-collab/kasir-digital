import type { ReactNode } from 'react'

import { protectPage } from '@/lib/page-auth'

export default async function KitchenLayout({
  children,
}: {
  children: ReactNode
}) {
  await protectPage(['owner', 'kitchen'])
  return children
}
