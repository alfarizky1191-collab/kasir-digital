import { NextResponse } from 'next/server'

import { supabaseConfig } from '@/lib/supabase-rest'

export function GET() {
  try {
    supabaseConfig()
    return NextResponse.json({
      status: 'ok',
      service: 'kasir-digital',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'misconfigured' },
      { status: 503 },
    )
  }
}
