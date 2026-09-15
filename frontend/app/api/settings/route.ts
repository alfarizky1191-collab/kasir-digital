import { NextResponse } from 'next/server'

import {
  jsonError,
  readJson,
  requireRole,
  rpc,
  supabaseFetch,
} from '@/lib/supabase-rest'

type Settings = {
  business_name: string
  currency: 'IDR'
  qris_image_url: string | null
  updated_at: string
}

export async function GET() {
  try {
    const response = await supabaseFetch(
      'rest/v1/pos_settings?select=business_name,currency,qris_image_url,updated_at&limit=1',
    )
    const settings = await readJson<Settings[]>(response)
    return NextResponse.json(settings[0] || null)
  } catch (error) {
    return jsonError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { token } = await requireRole(['owner'])
    const body = (await request.json()) as {
      businessName?: string
      qrisImageUrl?: string | null
    }
    const settings = await rpc<Settings>(
      'pos_update_settings',
      {
        p_business_name: body.businessName || '',
        p_qris_image_url: body.qrisImageUrl || null,
      },
      token,
    )
    return NextResponse.json(settings)
  } catch (error) {
    return jsonError(error)
  }
}
