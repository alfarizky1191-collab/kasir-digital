'use client'

import { useEffect, useState } from 'react'

import {
  apiRequest,
  formatRupiah,
} from '@/lib/client-api'
import type {
  PosOrder,
  StaffProfile,
} from '@/lib/types'

type HistoryResponse = {
  data: PosOrder[]
  page: number
  hasMore: boolean
}

type MeResponse = {
  staff: StaffProfile | null
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<PosOrder[]>([])
  const [role, setRole] = useState<StaffProfile['role']>(null)
  const [message, setMessage] = useState('Memuat riwayat...')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const load = (targetPage: number) =>
    apiRequest<HistoryResponse>(
      `/api/orders/history?page=${targetPage}`,
    ).then((result) => {
      setOrders(result.data)
      setPage(result.page)
      setHasMore(result.hasMore)
      setMessage('')
    })

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      Promise.all([
        apiRequest<HistoryResponse>('/api/orders/history?page=1'),
        apiRequest<MeResponse>('/api/auth/me'),
      ])
        .then(([history, me]) => {
          if (!active) return
          setOrders(history.data)
          setPage(history.page)
          setHasMore(history.hasMore)
          setRole(me.staff?.role || null)
          setMessage('')
        })
        .catch((error: Error) => {
          if (active) setMessage(error.message)
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

  const refund = async (order: PosOrder) => {
    const reason = window.prompt(
      `Alasan refund order #${order.order_number}:`,
    )
    if (!reason) return
    const restock = window.confirm(
      'Kembalikan item ke stok? Pilih OK jika barang kembali dan masih layak dijual.',
    )

    try {
      await apiRequest(`/api/orders/${order.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          reason,
          restock,
          idempotencyKey: crypto.randomUUID(),
        }),
      })
      await load(page)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Refund gagal',
      )
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <p className="text-sm font-black uppercase tracking-wider text-orange-400">
        Transaction history
      </p>
      <h1 className="mt-2 text-5xl font-black">Riwayat</h1>

      {message && (
        <p
          role="status"
          className="my-6 rounded-2xl bg-zinc-900 p-4 text-zinc-300"
        >
          {message}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-3xl border border-zinc-800">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-zinc-900 text-sm uppercase text-zinc-400">
            <tr>
              <th className="p-4">Order</th>
              <th className="p-4">Waktu</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-t border-zinc-800"
              >
                <td className="p-4 font-black">
                  #{order.order_number}
                </td>
                <td className="p-4 text-zinc-400">
                  {new Date(order.created_at).toLocaleString(
                    'id-ID',
                  )}
                </td>
                <td className="p-4">{order.customer_name}</td>
                <td className="p-4">
                  {order.payment_status}
                </td>
                <td className="p-4 text-right font-black">
                  {formatRupiah(order.total)}
                </td>
                <td className="p-4">
                  {role === 'owner' &&
                    order.payment_status === 'paid' && (
                      <button
                        type="button"
                        onClick={() => refund(order)}
                        className="rounded-xl bg-red-700 px-3 py-2 text-sm font-bold"
                      >
                        Refund
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => load(page - 1)}
          className="rounded-xl bg-zinc-800 px-4 py-2 font-bold disabled:opacity-40"
        >
          Sebelumnya
        </button>
        <button
          type="button"
          disabled={!hasMore}
          onClick={() => load(page + 1)}
          className="rounded-xl bg-zinc-800 px-4 py-2 font-bold disabled:opacity-40"
        >
          Berikutnya
        </button>
      </div>
    </div>
  )
}
