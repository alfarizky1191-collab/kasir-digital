import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PREFIXES = [
  '/admin',
  '/audit',
  '/cashier',
  '/history',
  '/kitchen',
  '/receipt',
  '/shift',
  '/access',
]

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function tokenExpiresSoon(token: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
    ) as { exp?: number }

    return !payload.exp || payload.exp <= Date.now() / 1000 + 60
  } catch {
    return true
  }
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('pos_access_token')?.value
  const refreshToken = request.cookies.get('pos_refresh_token')?.value
  let usableToken = accessToken
  const response = NextResponse.next({ request })

  if (
    (!accessToken || tokenExpiresSoon(accessToken)) &&
    refreshToken
  ) {
    const url =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (url && key) {
      const refreshResponse = await fetch(
        `${url.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`,
        {
          method: 'POST',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
          cache: 'no-store',
        },
      )

      if (refreshResponse.ok) {
        const auth = (await refreshResponse.json()) as {
          access_token: string
          refresh_token: string
          expires_in: number
        }
        usableToken = auth.access_token
        response.cookies.set('pos_access_token', auth.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: auth.expires_in,
        })
        response.cookies.set('pos_refresh_token', auth.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        })
      } else {
        usableToken = undefined
        response.cookies.delete('pos_access_token')
        response.cookies.delete('pos_refresh_token')
      }
    }
  }

  if (isProtected(request.nextUrl.pathname) && !usableToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set(
      'next',
      request.nextUrl.pathname,
    )
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
