import { NextResponse } from 'next/server'

import {
  jsonError,
  requireRole,
  rpc,
} from '@/lib/supabase-rest'
import type { PosOrder } from '@/lib/types'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { token } = await requireRole(['owner', 'kitchen'])
    const { id } = await context.params
    const body = (await request.json()) as { status?: string }
    const order = await rpc<PosOrder>(
      'pos_update_order_status',
      {
        p_order_id: id,
        p_status: body.status || '',
      },
      token,
    )

    return NextResponse.json(order)
  } catch (error) {
    return jsonError(error)
  }
}
