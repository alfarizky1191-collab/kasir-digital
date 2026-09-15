'use client'

import { useSearchParams } from 'next/navigation'
import {
  Suspense,
  useEffect,
  useState,
} from 'react'

import {
  apiRequest,
  formatRupiah,
} from '@/lib/client-api'

type PublicOrder = {
  order_number: number
  customer_name: string
  table_code: string | null
  status: string
  payment_status: string
  total: number
  items: {
    name: string
    quantity: number
    options: Record<string, string>
  }[]
}

const labels: Record<string, string> = {
  pending: 'Menunggu dapur',
  cooking: 'Sedang dimasak',
  ready: 'Siap diambil / dibayar',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

function WaitingContent() {
  const search = useSearchParams()
  const id = search.get('id')
  const token = search.get('token')
  const [order, setOrder] = useState<PublicOrder | null>(null)
  const [message, setMessage] = useState('Memuat status pesanan...')

  useEffect(() => {
    if (!id || !token) return

    let active = true
    const load = () => {
      apiRequest<PublicOrder>(
        `/api/orders/status?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`,
      )
        .then((data) => {
          if (active) {
            setOrder(data)
            setMessage('')
          }
        })
        .catch((error: Error) => {
          if (active) setMessage(error.message)
        })
    }
    const initial = window.setTimeout(load, 0)
    const interval = window.setInterval(load, 3000)

    return () => {
      active = false
      window.clearTimeout(initial)
      window.clearInterval(interval)
    }
  }, [id, token])

  if (!id || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-zinc-400">
        Link status pesanan tidak valid.
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-zinc-400">
        {message}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
        <p className="text-sm font-black uppercase tracking-widest text-orange-400">
          Pesanan #{order.order_number}
        </p>
        <h1 className="mt-4 text-4xl font-black">
          {labels[order.status] || order.status}
        </h1>
        <p className="mt-2 text-zinc-400">
          {order.customer_name}
          {order.table_code ? ` · Meja ${order.table_code}` : ''}
        </p>

        <div className="mt-8 space-y-3 border-y border-zinc-800 py-6">
          {order.items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex justify-between gap-4"
            >
              <span>
                {item.quantity}× {item.name}
              </span>
              <span className="text-zinc-500">
                {Object.values(item.options).join(', ')}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-3xl font-black text-orange-400">
          {formatRupiah(order.total)}
        </p>
        <p className="mt-5 text-sm leading-6 text-zinc-500">
          Halaman ini memperbarui status otomatis setiap beberapa detik.
          Simpan halaman sampai pesanan selesai.
        </p>
      </div>
    </div>
  )
}

export default function WaitingPage() {
  return (
    <Suspense fallback={null}>
      <WaitingContent />
    </Suspense>
  )
}
