import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import type { StaffProfile, StaffRole } from '@/lib/types'

type JsonRecord = Record<string, unknown>

type AuthPayload = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: {
    id: string
    email?: string
  }
}

export class PosApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
  }
}

export function supabaseConfig() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new PosApiError(
      'Supabase environment belum dikonfigurasi',
      503,
    )
  }

  return {
    url: url.replace(/\/$/, ''),
    key,
  }
}

export async function supabaseFetch(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
) {
  const { url, key } = supabaseConfig()
  const headers = new Headers(init.headers)

  headers.set('apikey', key)
  headers.set('Authorization', `Bearer ${accessToken || key}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${url}/${path.replace(/^\//, '')}`, {
    ...init,
    headers,
    cache: 'no-store',
  })
}

export async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | JsonRecord
    | T
    | null

  if (!response.ok) {
    const record = payload as JsonRecord | null
    const message =
      (typeof record?.message === 'string' && record.message) ||
      (typeof record?.error_description === 'string' &&
        record.error_description) ||
      (typeof record?.error === 'string' && record.error) ||
      'Permintaan tidak dapat diproses'

    throw new PosApiError(message, response.status)
  }

  return payload as T
}

export async function rpc<T>(
  name: string,
  body: JsonRecord,
  accessToken?: string | null,
) {
  const response = await supabaseFetch(
    `rest/v1/rpc/${name}`,
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(body),
    },
    accessToken,
  )

  return readJson<T>(response)
}

export async function getAccessToken() {
  return (await cookies()).get('pos_access_token')?.value || null
}

export async function getAuthenticatedUser() {
  const token = await getAccessToken()
  if (!token) {
    throw new PosApiError('Silakan masuk terlebih dahulu', 401)
  }

  const response = await supabaseFetch('auth/v1/user', {}, token)
  const user = await readJson<{ id: string; email?: string }>(response)

  return { token, user }
}

export async function requireRole(roles: StaffRole[]) {
  const { token, user } = await getAuthenticatedUser()
  const params = new URLSearchParams({
    user_id: `eq.${user.id}`,
    select: 'user_id,display_name,role,active,requested_at',
    limit: '1',
  })
  const response = await supabaseFetch(
    `rest/v1/pos_staff?${params.toString()}`,
    {},
    token,
  )
  const staff = await readJson<StaffProfile[]>(response)
  const profile = staff[0]

  if (
    !profile?.active ||
    !profile.role ||
    !roles.includes(profile.role)
  ) {
    throw new PosApiError(
      'Akun tidak memiliki akses ke fitur ini',
      403,
    )
  }

  return { token, user, staff: profile }
}

export function jsonError(error: unknown) {
  if (error instanceof PosApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    )
  }

  console.error('POS API error', error)
  return NextResponse.json(
    { error: 'Terjadi kesalahan pada server' },
    { status: 500 },
  )
}

export function setAuthCookies(
  response: NextResponse,
  auth: AuthPayload,
) {
  if (!auth.access_token || !auth.refresh_token) return response

  const secure = process.env.NODE_ENV === 'production'
  response.cookies.set('pos_access_token', auth.access_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: auth.expires_in || 3600,
  })
  response.cookies.set('pos_refresh_token', auth.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}
