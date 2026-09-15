import { NextResponse } from 'next/server'

import {
  jsonError,
  requireRole,
  rpc,
} from '@/lib/supabase-rest'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { token } = await requireRole(['owner', 'cashier'])
    const { id } = await context.params
    const body = (await request.json()) as {
      method?: 'cash' | 'qris'
      tendered?: number
      idempotencyKey?: string
    }
    const payment = await rpc<Record<string, unknown>>(
      'pos_pay_order',
      {
        p_order_id: id,
        p_method: body.method || '',
        p_tendered:
          body.method === 'qris'
            ? null
            : Number(body.tendered),
        p_idempotency_key: body.idempotencyKey || null,
      },
      token,
    )

    return NextResponse.json(payment)
  } catch (error) {
    return jsonError(error)
  }
}
