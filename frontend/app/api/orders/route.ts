import { createHmac } from 'node:crypto'

import { NextResponse } from 'next/server'

import {
  jsonError,
  PosApiError,
  privilegedRpc,
} from '@/lib/supabase-rest'

type CreateResult = {
  id: string
  order_number: number
  public_token: string
  status: string
  total: number
}

function requestFingerprint(request: Request) {
  const secret = process.env.RATE_LIMIT_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new PosApiError(
      'Rate limit belum dikonfigurasi',
      503,
    )
  }

  const forwarded =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local-development'

  return createHmac(
    'sha256',
    secret || 'local-development-only',
  )
    .update(forwarded)
    .digest('hex')
}

export async function POST(request: Request) {
  try {
    const allowed = await privilegedRpc<boolean>('pos_check_order_rate', {
      p_key_hash: requestFingerprint(request),
      p_limit: 10,
      p_window_seconds: 60,
    })

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            'Terlalu banyak pesanan. Tunggu sebentar lalu coba lagi.',
        },
        {
          status: 429,
          headers: { 'Retry-After': '60' },
        },
      )
    }

    const body = (await request.json()) as {
      customerName?: string
      tableCode?: string | null
      clientToken?: string
      items?: {
        productId?: string
        quantity?: number
        options?: Record<string, string>
      }[]
    }

    if (
      !body.clientToken ||
      !Array.isArray(body.items) ||
      body.items.length < 1 ||
      body.items.length > 50
    ) {
      return NextResponse.json(
        { error: 'Order tidak valid' },
        { status: 400 },
      )
    }

    const result = await privilegedRpc<CreateResult>(
      'pos_create_order',
      {
        p_customer_name: body.customerName || 'Tamu',
        p_table_code: body.tableCode || null,
        p_items: body.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          options: item.options || {},
        })),
        p_client_token: body.clientToken,
      },
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return jsonError(error)
  }
}
