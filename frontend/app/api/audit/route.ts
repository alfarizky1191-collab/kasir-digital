import { NextRequest, NextResponse } from 'next/server'

import {
  jsonError,
  readJson,
  requireRole,
  supabaseFetch,
} from '@/lib/supabase-rest'

export async function GET(request: NextRequest) {
  try {
    const { token } = await requireRole(['owner'])
    const page = Math.max(
      1,
      Number(request.nextUrl.searchParams.get('page')) || 1,
    )
    const pageSize = 50
    const params = new URLSearchParams({
      select:
        'id,actor_id,action,entity_type,entity_id,reason,metadata,created_at',
      order: 'created_at.desc',
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    })
    const response = await supabaseFetch(
      `rest/v1/pos_audit_logs?${params.toString()}`,
      {},
      token,
    )
    const data = await readJson<unknown[]>(response)

    return NextResponse.json({
      data,
      page,
      hasMore: data.length === pageSize,
    })
  } catch (error) {
    return jsonError(error)
  }
}
