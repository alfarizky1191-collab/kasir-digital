import { NextResponse } from 'next/server'

import {
  jsonError,
  readJson,
  requireRole,
  supabaseFetch,
} from '@/lib/supabase-rest'
import type { Shift } from '@/lib/types'

export async function GET() {
  try {
    const { token } = await requireRole([
      'owner',
      'cashier',
      'kitchen',
    ])
    const params = new URLSearchParams({
      select: '*',
      order: 'opened_at.desc',
      limit: '100',
    })
    const response = await supabaseFetch(
      `rest/v1/pos_shifts?${params.toString()}`,
      {},
      token,
    )

    return NextResponse.json(
      await readJson<Shift[]>(response),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return jsonError(error)
  }
}
