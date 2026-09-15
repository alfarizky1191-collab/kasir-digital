import { NextResponse } from 'next/server'

import {
  getAuthenticatedUser,
  jsonError,
  readJson,
  rpc,
  supabaseFetch,
} from '@/lib/supabase-rest'
import type { StaffProfile } from '@/lib/types'

export async function GET() {
  try {
    const { token, user } = await getAuthenticatedUser()
    const params = new URLSearchParams({
      user_id: `eq.${user.id}`,
      select: 'user_id,display_name,role,active,requested_at',
      limit: '1',
    })
    const staffResponse = await supabaseFetch(
      `rest/v1/pos_staff?${params.toString()}`,
      {},
      token,
    )
    const staff = await readJson<StaffProfile[]>(staffResponse)
    const bootstrap = await rpc<{ has_owner: boolean }>(
      'pos_bootstrap_status',
      {},
      token,
    )

    return NextResponse.json({
      user,
      staff: staff[0] || null,
      hasOwner: bootstrap.has_owner,
    })
  } catch (error) {
    return jsonError(error)
  }
}
