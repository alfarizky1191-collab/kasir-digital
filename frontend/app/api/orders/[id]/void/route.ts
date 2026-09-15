import { NextResponse } from 'next/server'

import {
  jsonError,
  requireRole,
  rpc,
} from '@/lib/supabase-rest'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { token } = await requireRole(['owner', 'cashier'])
    const { id } = await context.params
    const body = (await request.json()) as { reason?: string }
    const result = await rpc<Record<string, unknown>>(
      'pos_void_order',
      {
        p_order_id: id,
        p_reason: body.reason || '',
      },
      token,
    )

    return NextResponse.json(result)
  } catch (error) {
    return jsonError(error)
  }
}
