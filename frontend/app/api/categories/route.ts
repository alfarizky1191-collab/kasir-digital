import { NextResponse } from 'next/server'

import {
  jsonError,
  readJson,
  supabaseFetch,
} from '@/lib/supabase-rest'

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
      await readJson<unknown[]>(response),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return jsonError(error)
  }
}
