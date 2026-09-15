import { NextResponse } from 'next/server'

import {
  jsonError,
  readJson,
  setAuthCookies,
  supabaseFetch,
} from '@/lib/supabase-rest'

type SignupResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user: { id: string; email?: string }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
      displayName?: string
    }
    const email = body.email?.trim().toLowerCase()
    const password = body.password || ''
    const displayName = body.displayName?.trim() || ''

    if (
      !email ||
      password.length < 8 ||
      displayName.length < 2 ||
      displayName.length > 80
    ) {
      return NextResponse.json(
        { error: 'Nama, email, atau password tidak valid' },
        { status: 400 },
      )
    }

    const authResponse = await supabaseFetch('auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        data: { display_name: displayName },
      }),
    })
    const auth = await readJson<SignupResponse>(authResponse)
    const response = NextResponse.json({
      success: true,
      needsEmailConfirmation: !auth.access_token,
      user: auth.user,
    })

    return setAuthCookies(response, auth)
  } catch (error) {
    return jsonError(error)
  }
}
