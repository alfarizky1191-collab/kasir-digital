import { NextResponse } from 'next/server'

import {
  jsonError,
  rpc,
} from '@/lib/supabase-rest'

type CreateResult = {
  id: string
  order_number: number
  public_token: string
  status: string
  total: number
}

export async function POST(request: Request) {
  try {
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

    const result = await rpc<CreateResult>(
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
