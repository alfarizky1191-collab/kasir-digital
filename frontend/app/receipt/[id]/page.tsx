'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  apiRequest,
  formatRupiah,
} from '@/lib/client-api'
import type { PosOrder } from '@/lib/types'

export default function ReceiptPage() {
  const params = useParams<{ id: string }>()
  const [order, setOrder] = useState<PosOrder | null>(null)
  const [message, setMessage] = useState('Memuat struk...')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      apiRequest<PosOrder>(
        `/api/orders/${encodeURIComponent(params.id)}`,
      )
        .then((data) => {
          if (active) {
            setOrder(data)
            setMessage('')
            window.setTimeout(() => window.print(), 400)
          }
        })
        .catch((error: Error) => {
          if (active) setMessage(error.message)
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [params.id])

  if (!order) {
    return <div className="p-10 text-zinc-400">{message}</div>
  }

  return (
    <div className="min-h-screen bg-white p-6 text-black">
      <div className="mx-auto w-[320px] text-sm">
        <div className="border-b border-dashed border-black pb-4 text-center">
          <h1 className="text-2xl font-black">ALUNA EATS</h1>
          <p>Kasir Digital</p>
        </div>
        <div className="space-y-1 py-4">
          <p>Order #{order.order_number}</p>
          <p>
            {new Date(order.created_at).toLocaleString('id-ID')}
          </p>
          <p>
            {order.customer_name}
            {order.table_code ? ` · Meja ${order.table_code}` : ''}
          </p>
        </div>
        <div className="space-y-3 border-y border-dashed border-black py-4">
          {order.items?.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between gap-4">
                <span>
                  {item.quantity}× {item.product_name}
                </span>
                <span>{formatRupiah(item.subtotal)}</span>
              </div>
              {Object.keys(item.options).length > 0 && (
                <p className="text-xs text-zinc-600">
                  {Object.entries(item.options)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between py-4 text-lg font-black">
          <span>Total</span>
          <span>{formatRupiah(order.total)}</span>
        </div>
        <p className="text-center text-xs">
          Terima kasih sudah berbelanja.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print mt-8 w-full rounded-xl bg-black py-3 font-bold text-white"
        >
          Cetak lagi
        </button>
      </div>
    </div>
  )
}
