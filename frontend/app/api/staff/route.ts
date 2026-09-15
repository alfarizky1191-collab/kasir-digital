import { NextResponse } from 'next/server'

import {
  jsonError,
  readJson,
  requireRole,
  rpc,
  supabaseFetch,
} from '@/lib/supabase-rest'
import type { StaffProfile, StaffRole } from '@/lib/types'

export async function GET() {
  try {
    const { token } = await requireRole(['owner'])
    const params = new URLSearchParams({
      select: 'user_id,display_name,role,active,requested_at',
      order: 'requested_at.desc',
    })
    const response = await supabaseFetch(
      `rest/v1/pos_staff?${params.toString()}`,
      {},
      token,
    )

    return NextResponse.json(
      await readJson<StaffProfile[]>(response),
    )
  } catch (error) {
    return jsonError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { token } = await requireRole(['owner'])
    const body = (await request.json()) as {
      userId?: string
      role?: StaffRole
      active?: boolean
    }
    const result = await rpc<Record<string, unknown>>(
      'pos_set_staff_access',
      {
        p_user_id: body.userId || null,
        p_role: body.role || '',
        p_active: body.active === true,
      },
      token,
    )

    return NextResponse.json(result)
  } catch (error) {
    return jsonError(error)
  }
}
