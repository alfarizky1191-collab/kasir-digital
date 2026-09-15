import type { ReactNode } from 'react'

import { protectPage } from '@/lib/page-auth'

export default async function CashierLayout({
  children,
}: {
  children: ReactNode
}) {
  await protectPage(['owner', 'cashier'])
  return children
}
