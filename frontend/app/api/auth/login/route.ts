import { NextResponse } from 'next/server'

import {
  jsonError,
  readJson,
  setAuthCookies,
  supabaseFetch,
} from '@/lib/supabase-rest'

type AuthResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  user: { id: string; email?: string }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
    }
    const email = body.email?.trim().toLowerCase()
    const password = body.password || ''

    if (!email || password.length < 8) {
      return NextResponse.json(
        { error: 'Email atau password tidak valid' },
        { status: 400 },
      )
    }

    const authResponse = await supabaseFetch(
      'auth/v1/token?grant_type=password',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    )
    const auth = await readJson<AuthResponse>(authResponse)
    const response = NextResponse.json({
      success: true,
      user: auth.user,
    })

    return setAuthCookies(response, auth)
  } catch (error) {
    return jsonError(error)
  }
}
