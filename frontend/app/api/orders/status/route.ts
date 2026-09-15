import { NextRequest, NextResponse } from 'next/server'

import {
  jsonError,
  rpc,
} from '@/lib/supabase-rest'

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    const token = request.nextUrl.searchParams.get('token')

    if (!id || !token) {
      return NextResponse.json(
        { error: 'Order token diperlukan' },
        { status: 400 },
      )
    }

    const order = await rpc<Record<string, unknown> | null>(
      'pos_get_order_status',
      { p_order_id: id, p_public_token: token },
    )

    if (!order) {
      return NextResponse.json(
        { error: 'Order tidak ditemukan' },
        { status: 404 },
      )
    }

    return NextResponse.json(order, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return jsonError(error)
  }
}
