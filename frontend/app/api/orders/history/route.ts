import { NextRequest, NextResponse } from 'next/server'

import { listOrders } from '@/lib/data-api'
import {
  jsonError,
  requireRole,
} from '@/lib/supabase-rest'

export async function GET(request: NextRequest) {
  try {
    const { token } = await requireRole(['owner', 'cashier'])
    const page = Math.max(
      1,
      Number(request.nextUrl.searchParams.get('page')) || 1,
    )
    const pageSize = 50
    const orders = await listOrders(token, {
      status: 'in.(completed,cancelled)',
      order: 'created_at.desc',
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    })

    return NextResponse.json({
      data: orders,
      page,
      hasMore: orders.length === pageSize,
    })
  } catch (error) {
    return jsonError(error)
  }
}
