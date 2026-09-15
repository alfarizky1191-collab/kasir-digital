import { NextResponse } from 'next/server'

import {
  supabaseConfig,
  supabaseFetch,
  supabaseSecretConfig,
} from '@/lib/supabase-rest'

export async function GET() {
  try {
    supabaseConfig()
    supabaseSecretConfig()
  } catch {
    return NextResponse.json(
      { status: 'misconfigured' },
      { status: 503 },
    )
  }

  try {
    const database = await supabaseFetch(
      'rest/v1/pos_settings?select=id&limit=1',
    )

    if (!database.ok) {
      return NextResponse.json(
        { status: 'dependency_unavailable' },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        status: 'ok',
        service: 'kasir-digital',
        timestamp: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { status: 'dependency_unavailable' },
      { status: 503 },
    )
  }
}
