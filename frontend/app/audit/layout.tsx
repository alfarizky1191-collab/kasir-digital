import type { ReactNode } from 'react'

import { protectPage } from '@/lib/page-auth'

export default async function AuditLayout({
  children,
}: {
  children: ReactNode
}) {
  await protectPage(['owner'])
  return children
}
