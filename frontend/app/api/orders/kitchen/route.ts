import { NextResponse } from 'next/server'

import { listOrders } from '@/lib/data-api'
import {
  jsonError,
  requireRole,
} from '@/lib/supabase-rest'

export async function GET() {
  try {
    const { token } = await requireRole(['owner', 'kitchen'])
    const orders = await listOrders(token, {
      status: 'in.(pending,cooking,ready)',
      order: 'created_at.asc',
      limit: '200',
    })

    return NextResponse.json(orders, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return jsonError(error)
  }
}
