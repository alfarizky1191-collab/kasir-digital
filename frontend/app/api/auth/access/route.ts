import { NextResponse } from 'next/server'

import {
  getAuthenticatedUser,
  jsonError,
  rpc,
} from '@/lib/supabase-rest'

export async function POST(request: Request) {
  try {
    const { token } = await getAuthenticatedUser()
    const body = (await request.json()) as {
      displayName?: string
      action?: 'claim-owner' | 'request'
    }
    const displayName = body.displayName?.trim() || ''

    if (displayName.length < 2 || displayName.length > 80) {
      return NextResponse.json(
        { error: 'Nama harus 2-80 karakter' },
        { status: 400 },
      )
    }

    const functionName =
      body.action === 'claim-owner'
        ? 'pos_claim_first_owner'
        : 'pos_request_access'
    const result = await rpc<Record<string, unknown>>(
      functionName,
      { p_display_name: displayName },
      token,
    )

    return NextResponse.json(result)
  } catch (error) {
    return jsonError(error)
  }
}
