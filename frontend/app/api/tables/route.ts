import { NextRequest, NextResponse } from 'next/server'

import {
  jsonError,
  readJson,
  requireRole,
  rpc,
  supabaseFetch,
} from '@/lib/supabase-rest'
import type { DiningTable } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const token =
      request.nextUrl.searchParams.get('scope') === 'admin'
        ? (await requireRole(['owner'])).token
        : null
    const params = new URLSearchParams({
      select: 'id,code,active',
      order: 'code.asc',
    })
    const response = await supabaseFetch(
      `rest/v1/pos_tables?${params.toString()}`,
      {},
      token,
    )

    return NextResponse.json(
      await readJson<DiningTable[]>(response),
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
      code?: string
      active?: boolean
    }
    const table = await rpc<DiningTable>(
      'pos_upsert_table',
      {
        p_id: body.id || null,
        p_code: body.code || '',
        p_active: body.active !== false,
      },
      token,
    )

    return NextResponse.json(table)
  } catch (error) {
    return jsonError(error)
  }
}
