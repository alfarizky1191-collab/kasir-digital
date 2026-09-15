import { NextResponse } from 'next/server'

import {
  jsonError,
  requireRole,
  rpc,
} from '@/lib/supabase-rest'

export async function GET() {
  try {
    const { token } = await requireRole(['owner'])
    const summary = await rpc<Record<string, unknown>>(
      'pos_dashboard_summary',
      {},
      token,
    )
    return NextResponse.json(summary)
  } catch (error) {
    return jsonError(error)
  }
}
