import { NextResponse } from 'next/server'

import {
  jsonError,
  readJson,
  requireRole,
  rpc,
  supabaseFetch,
} from '@/lib/supabase-rest'

type Category = {
  id: string
  name: string
  sort_order: number
  active: boolean
}

export async function GET() {
  try {
    const params = new URLSearchParams({
      select: 'id,name,sort_order,active',
      order: 'sort_order.asc,name.asc',
    })
    const response = await supabaseFetch(
      `rest/v1/pos_categories?${params.toString()}`,
    )

    return NextResponse.json(
      await readJson<Category[]>(response),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await requireRole(['owner'])
    const body = (await request.json()) as {
      id?: string | null
      name?: string
      sortOrder?: number
      active?: boolean
    }
    const category = await rpc<Category>(
      'pos_upsert_category',
      {
        p_id: body.id || null,
        p_name: body.name || '',
        p_sort_order: Number(body.sortOrder) || 0,
        p_active: body.active !== false,
      },
      token,
    )

    return NextResponse.json(category)
  } catch (error) {
    return jsonError(error)
  }
}
