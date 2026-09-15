import { redirect } from 'next/navigation'

import {
  PosApiError,
  requireRole,
} from '@/lib/supabase-rest'
import type { StaffRole } from '@/lib/types'

export async function protectPage(roles: StaffRole[]) {
  try {
    return await requireRole(roles)
  } catch (error) {
    if (error instanceof PosApiError && error.status === 401) {
      redirect('/login')
    }

    redirect('/access')
  }
}
