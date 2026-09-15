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
      shiftId?: string
      actualCash?: number
      notes?: string
    }
    const shift = await rpc<Shift>(
      'pos_close_shift',
      {
        p_shift_id: body.shiftId || null,
        p_actual_cash: Number(body.actualCash),
        p_notes: body.notes || null,
      },
      token,
    )

    return NextResponse.json({ success: true, data: shift })
  } catch (error) {
    return jsonError(error)
  }
}
