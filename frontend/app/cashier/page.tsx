'use client'

import { useEffect, useState } from 'react'

import {
  apiRequest,
  formatRupiah,
} from '@/lib/client-api'
import type { PosOrder } from '@/lib/types'

type PaymentResult = {
  order_id: string
  change_amount: number
}

export default function CashierPage() {
  const [orders, setOrders] = useState<PosOrder[]>([])
  const [selected, setSelected] = useState<PosOrder | null>(null)
  const [tendered, setTendered] = useState('')
  const [message, setMessage] = useState('Memuat antrean kasir...')
  const [pending, setPending] = useState(false)

  const loadOrders = () =>
    apiRequest<PosOrder[]>('/api/orders/cashier').then((data) => {
      setOrders(data)
      setMessage('')
    })

  useEffect(() => {
    let active = true
    const load = () => {
      apiRequest<PosOrder[]>('/api/orders/cashier')
        .then((data) => {
          if (active) {
            setOrders(data)
            setMessage('')
          }
        })
        .catch((error: Error) => {
          if (active) setMessage(error.message)
        })
    }
    const initial = window.setTimeout(load, 0)
    const polling = window.setInterval(load, 3000)

    return () => {
      active = false
      window.clearTimeout(initial)
      window.clearInterval(polling)
    }
  }, [])

  const pay = async (
    order: PosOrder,
    method: 'cash' | 'qris',
    amount?: number,
  ) => {
    if (pending) return
    if (
      method === 'qris' &&
      !window.confirm(
        'Pastikan pembayaran QRIS sudah terlihat masuk. Konfirmasi lunas?',
      )
    ) {
      return
    }

    setPending(true)
    setMessage('')

    try {
      const result = await apiRequest<PaymentResult>(
        `/api/orders/${order.id}/payment`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            method,
            tendered: amount,
            idempotencyKey: crypto.randomUUID(),
          }),
        },
      )
      setSelected(null)
      setTendered('')
      await loadOrders()
      window.open(
        `/receipt/${encodeURIComponent(result.order_id)}`,
        '_blank',
        'noopener,noreferrer',
      )
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Pembayaran gagal',
      )
    } finally {
      setPending(false)
    }
  }

  const voidOrder = async (order: PosOrder) => {
    const reason = window.prompt(
      `Alasan membatalkan order #${order.order_number}:`,
    )
    if (!reason) return

    try {
      await apiRequest(`/api/orders/${order.id}/void`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
      await loadOrders()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Void gagal',
      )
    }
  }

  const paid = Number(tendered || 0)
  const change = selected ? paid - selected.total : 0

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <p className="text-sm font-black uppercase tracking-wider text-orange-400">
        Payment queue
      </p>
      <h1 className="mt-2 text-5xl font-black">Kasir</h1>

      {message && (
        <p
          role="status"
          className="my-6 rounded-2xl bg-zinc-900 p-4 text-zinc-300"
        >
          {message}
        </p>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
          >
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">
                  #{order.order_number}
                </h2>
                <p className="mt-1 text-zinc-400">
                  {order.customer_name}
                  {order.table_code
                    ? ` · Meja ${order.table_code}`
                    : ''}
                </p>
              </div>
              <p className="text-2xl font-black text-orange-400">
                {formatRupiah(order.total)}
              </p>
            </div>
            <div className="my-5 space-y-2 border-y border-zinc-800 py-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4"
                >
                  <span>
                    {item.quantity}× {item.product_name}
                  </span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelected(order)}
                className="rounded-xl bg-green-600 py-3 font-black"
              >
                Tunai
              </button>
              <button
                type="button"
                onClick={() => pay(order, 'qris')}
                className="rounded-xl bg-blue-600 py-3 font-black"
              >
                QRIS
              </button>
              <button
                type="button"
                onClick={() => voidOrder(order)}
                className="rounded-xl bg-red-700 py-3 font-black"
              >
                Void
              </button>
            </div>
          </article>
        ))}
      </div>

      {!orders.length && !message && (
        <div className="mt-8 rounded-3xl border border-dashed border-zinc-700 p-16 text-center text-zinc-500">
          Tidak ada order siap bayar.
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-zinc-700 bg-zinc-950 p-6">
            <h2 className="text-3xl font-black">Pembayaran Tunai</h2>
            <p className="mt-3 text-zinc-400">
              Total {formatRupiah(selected.total)}
            </p>
            <input
              autoFocus
              type="number"
              min={selected.total}
              value={tendered}
              onChange={(event) => setTendered(event.target.value)}
              placeholder="Uang diterima"
              className="mt-5 w-full rounded-2xl border border-zinc-700 bg-black px-4 py-4 text-xl"
            />
            <p
              className={
                change < 0
                  ? 'mt-4 font-bold text-red-400'
                  : 'mt-4 font-bold text-green-400'
              }
            >
              Kembalian: {formatRupiah(Math.max(0, change))}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl bg-zinc-800 py-3 font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={pending || change < 0}
                onClick={() => pay(selected, 'cash', paid)}
                className="rounded-xl bg-green-600 py-3 font-black disabled:opacity-50"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
