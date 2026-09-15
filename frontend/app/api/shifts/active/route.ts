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
      status: 'eq.open',
      limit: '1',
    })
    const response = await supabaseFetch(
      `rest/v1/pos_shifts?${params.toString()}`,
      {},
      token,
    )
    const shifts = await readJson<Shift[]>(response)

    return NextResponse.json({ data: shifts[0] || null })
  } catch (error) {
    return jsonError(error)
  }
}
