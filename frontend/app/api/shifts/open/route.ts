import { NextResponse } from 'next/server'

import {
  jsonError,
  requireRole,
  rpc,
} from '@/lib/supabase-rest'
import type { Shift } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { token } = await requireRole(['owner', 'cashier'])
    const body = (await request.json()) as {
      openingCash?: number
    }
    const shift = await rpc<Shift>(
      'pos_open_shift',
      { p_opening_cash: Number(body.openingCash) },
      token,
    )

    return NextResponse.json({ success: true, data: shift })
  } catch (error) {
    return jsonError(error)
  }
}
