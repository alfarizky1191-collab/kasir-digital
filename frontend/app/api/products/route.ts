import { NextResponse } from 'next/server'

import {
  jsonError,
  readJson,
  requireRole,
  rpc,
  supabaseFetch,
} from '@/lib/supabase-rest'
import type { Product } from '@/lib/types'

export async function GET() {
  try {
    const params = new URLSearchParams({
      select:
        'id,category_id,name,price,stock,track_stock,sold_out,active,image_url,options',
      order: 'name.asc',
    })
    const response = await supabaseFetch(
      `rest/v1/pos_products?${params.toString()}`,
    )
    const products = await readJson<Product[]>(response)

    return NextResponse.json(products, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await requireRole(['owner'])
    const body = (await request.json()) as {
      id?: string | null
      categoryId?: string | null
      name?: string
      price?: number
      stock?: number
      trackStock?: boolean
      soldOut?: boolean
      active?: boolean
      imageUrl?: string | null
      options?: unknown[]
    }
    const product = await rpc<Product>(
      'pos_upsert_product',
      {
        p_id: body.id || null,
        p_category_id: body.categoryId || null,
        p_name: body.name || '',
        p_price: Number(body.price),
        p_stock: Number(body.stock),
        p_track_stock: body.trackStock !== false,
        p_sold_out: body.soldOut === true,
        p_active: body.active !== false,
        p_image_url: body.imageUrl || null,
        p_options: body.options || [],
      },
      token,
    )

    return NextResponse.json(product)
  } catch (error) {
    return jsonError(error)
  }
}
