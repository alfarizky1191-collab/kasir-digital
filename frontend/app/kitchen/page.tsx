'use client'

import { useEffect, useRef, useState } from 'react'

import {
  apiRequest,
  formatRupiah,
} from '@/lib/client-api'
import type { PosOrder } from '@/lib/types'

function elapsed(createdAt: string, now: number) {
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(createdAt).getTime()) / 1000),
  )
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return [hours, minutes, rest]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<PosOrder[]>([])
  const [message, setMessage] = useState('Memuat antrean...')
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [now, setNow] = useState(0)
  const knownIds = useRef(new Set<string>())
  const initialized = useRef(false)

  useEffect(() => {
    let active = true

    const load = () => {
      apiRequest<PosOrder[]>('/api/orders/kitchen')
        .then((data) => {
          if (!active) return

          const hasNew =
            initialized.current &&
            data.some(
              (order) =>
                order.status === 'pending' &&
                !knownIds.current.has(order.id),
            )
          knownIds.current = new Set(data.map((order) => order.id))
          initialized.current = true
          setOrders(data)
          setMessage('')

          if (hasNew && soundEnabled) {
            const AudioContextClass =
              window.AudioContext ||
              (
                window as typeof window & {
                  webkitAudioContext?: typeof AudioContext
                }
              ).webkitAudioContext
            if (AudioContextClass) {
              const context = new AudioContextClass()
              const oscillator = context.createOscillator()
              const gain = context.createGain()
              oscillator.frequency.value = 880
              gain.gain.value = 0.18
              oscillator.connect(gain)
              gain.connect(context.destination)
              oscillator.start()
              oscillator.stop(context.currentTime + 0.25)
            }
          }
        })
        .catch((error: Error) => {
          if (active) setMessage(error.message)
        })
    }

    const initial = window.setTimeout(load, 0)
    const polling = window.setInterval(load, 3000)
    const clock = window.setInterval(
      () => setNow(new Date().getTime()),
      1000,
    )

    return () => {
      active = false
      window.clearTimeout(initial)
      window.clearInterval(polling)
      window.clearInterval(clock)
    }
  }, [soundEnabled])

  const updateStatus = async (
    order: PosOrder,
    status: 'cooking' | 'ready',
  ) => {
    try {
      const updated = await apiRequest<PosOrder>(
        `/api/orders/${order.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
      )
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? updated : item,
        ),
      )
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Update gagal',
      )
    }
  }

  const columns = [
    {
      key: 'pending',
      label: 'Menunggu',
      accent: 'text-yellow-300',
    },
    {
      key: 'cooking',
      label: 'Dimasak',
      accent: 'text-blue-300',
    },
    {
      key: 'ready',
      label: 'Siap',
      accent: 'text-green-300',
    },
  ] as const

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-orange-400">
            Kitchen display
          </p>
          <h1 className="mt-2 text-5xl font-black">
            Antrean Dapur
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled((value) => !value)}
          className="rounded-2xl border border-zinc-700 px-4 py-3 font-bold"
        >
          Suara {soundEnabled ? 'Aktif' : 'Mati'}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className="mb-6 rounded-2xl bg-zinc-900 p-4 text-zinc-300"
        >
          {message}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {columns.map((column) => (
          <section
            key={column.key}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <h2
              className={`mb-4 text-lg font-black uppercase ${column.accent}`}
            >
              {column.label} (
              {
                orders.filter(
                  (order) => order.status === column.key,
                ).length
              }
              )
            </h2>
            <div className="space-y-4">
              {orders
                .filter((order) => order.status === column.key)
                .map((order) => (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-zinc-800 bg-black p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-2xl font-black">
                          #{order.order_number}
                        </p>
                        <p className="text-zinc-400">
                          {order.customer_name}
                          {order.table_code
                            ? ` · ${order.table_code}`
                            : ''}
                        </p>
                      </div>
                      <p
                        className={
                          now &&
                          now -
                            new Date(order.created_at).getTime() >
                            15 * 60 * 1000
                            ? 'font-mono text-red-400'
                            : 'font-mono text-zinc-400'
                        }
                      >
                        {now ? elapsed(order.created_at, now) : '--:--'}
                      </p>
                    </div>
                    <div className="my-4 space-y-2 border-y border-zinc-800 py-4">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-3"
                        >
                          <span>
                            {item.quantity}× {item.product_name}
                          </span>
                          <span className="text-sm text-zinc-500">
                            {Object.values(item.options).join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mb-4 font-black text-orange-400">
                      {formatRupiah(order.total)}
                    </p>
                    {order.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(order, 'cooking')
                        }
                        className="w-full rounded-xl bg-blue-500 py-3 font-black text-black"
                      >
                        Mulai Masak
                      </button>
                    )}
                    {order.status === 'cooking' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(order, 'ready')}
                        className="w-full rounded-xl bg-green-500 py-3 font-black text-black"
                      >
                        Tandai Siap
                      </button>
                    )}
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
