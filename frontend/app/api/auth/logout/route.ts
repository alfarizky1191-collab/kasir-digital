import { NextResponse } from 'next/server'

import {
  getAccessToken,
  supabaseFetch,
} from '@/lib/supabase-rest'

export async function POST() {
  const token = await getAccessToken()

  if (token) {
    await supabaseFetch(
      'auth/v1/logout',
      { method: 'POST' },
      token,
    ).catch(() => null)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('pos_access_token')
  response.cookies.delete('pos_refresh_token')
  return response
}
