import { NextResponse } from 'next/server'

import { getOrder } from '@/lib/data-api'
import {
  jsonError,
  requireRole,
} from '@/lib/supabase-rest'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { token } = await requireRole(['owner', 'cashier'])
    const { id } = await context.params
    const order = await getOrder(token, id)

    if (!order) {
      return NextResponse.json(
        { error: 'Order tidak ditemukan' },
        { status: 404 },
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    return jsonError(error)
  }
}
