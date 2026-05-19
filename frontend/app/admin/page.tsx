'use client'

import { useEffect, useMemo, useState } from 'react'

type Order = {
  id: string
  total: number
  paymentStatus: string
  status: string
  createdAt: string
  items: {
    name: string
    qty: number
    price: number
  }[]
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/orders/history',
      )

      const data = await response.json()

      if (Array.isArray(data)) {
        setOrders(data)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const totalRevenue = useMemo(() => {
    return orders.reduce(
      (acc, order) => acc + order.total,
      0,
    )
  }, [orders])

  const totalTransactions =
    orders.length

  const totalItemsSold = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const qty = order.items.reduce(
          (sum, item) =>
            sum + item.qty,
          0,
        )

        return acc + qty
      },
      0,
    )
  }, [orders])

  const menuStats = useMemo(() => {
    const stats: Record<
      string,
      number
    > = {}

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!stats[item.name]) {
          stats[item.name] = 0
        }

        stats[item.name] += item.qty
      })
    })

    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [orders])

  const revenueByHour = useMemo(() => {
    const hours: Record<
      string,
      number
    > = {}

    orders.forEach((order) => {
      const hour = new Date(
        order.createdAt,
      ).getHours()

      const key = `${hour
        .toString()
        .padStart(2, '0')}:00`

      if (!hours[key]) {
        hours[key] = 0
      }

      hours[key] += order.total
    })

    return Object.entries(hours).sort()
  }, [orders])

  const highestRevenue =
    Math.max(
      ...revenueByHour.map(
        ([, value]) => value,
      ),
      1,
    )

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl">
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="mb-10">
        <h1 className="text-3xl md:text-6xl font-black">
          Owner Dashboard
        </h1>

        <p className="text-zinc-400 mt-2 text-sm md:text-lg">
          Restaurant Analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <p className="text-zinc-400">
            Total Revenue
          </p>

          <h2 className="text-3xl md:text-5xl font-black text-orange-400 mt-4">
            Rp{' '}
            {totalRevenue.toLocaleString(
              'id-ID',
            )}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <p className="text-zinc-400">
            Transactions
          </p>

          <h2 className="text-3xl md:text-5xl font-black mt-4">
            {totalTransactions}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <p className="text-zinc-400">
            Items Sold
          </p>

          <h2 className="text-3xl md:text-5xl font-black mt-4">
            {totalItemsSold}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-2xl md:text-3xl font-black mb-6">
            Top Selling Menu
          </h2>

          <div className="space-y-4">
            {menuStats.length === 0 ? (
              <p className="text-zinc-500">
                No data yet
              </p>
            ) : (
              menuStats.map(
                ([name, qty]) => (
                  <div
                    key={name}
                    className="bg-black/40 rounded-2xl px-5 py-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-lg md:text-2xl font-bold">
                        {name}
                      </p>
                    </div>

                    <div className="text-orange-400 text-xl md:text-3xl font-black">
                      {qty}
                    </div>
                  </div>
                ),
              )
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-2xl md:text-3xl font-black mb-6">
            Recent Transactions
          </h2>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-zinc-500">
                No transactions yet
              </p>
            ) : (
              orders
                .slice(0, 5)
                .map((order) => (
                  <div
                    key={order.id}
                    className="bg-black/40 rounded-2xl px-5 py-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-lg font-bold">
                        {order.id}
                      </p>

                      <p className="text-zinc-500 text-sm mt-1">
                        {new Date(
                          order.createdAt,
                        ).toLocaleString(
                          'id-ID',
                        )}
                      </p>
                    </div>

                    <div className="text-orange-400 text-lg md:text-2xl font-black">
                      Rp{' '}
                      {order.total.toLocaleString(
                        'id-ID',
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black">
              Revenue By Hour
            </h2>

            <p className="text-zinc-500 mt-2">
              Live sales overview
            </p>
          </div>
        </div>

        {revenueByHour.length === 0 ? (
          <p className="text-zinc-500">
            No chart data yet
          </p>
        ) : (
          <div className="flex items-end gap-3 h-[260px] overflow-x-auto">
            {revenueByHour.map(
              ([hour, value]) => {
                const height =
                  (value /
                    highestRevenue) *
                  100

                return (
                  <div
                    key={hour}
                    className="flex flex-col items-center justify-end min-w-[70px] h-full"
                  >
                    <div className="text-xs text-zinc-500 mb-2">
                      Rp{' '}
                      {Math.round(
                        value / 1000,
                      )}
                      k
                    </div>

                    <div
                      className="w-full rounded-t-2xl bg-orange-500 transition-all duration-500"
                      style={{
                        height: `${Math.max(
                          height,
                          8,
                        )}%`,
                      }}
                    />

                    <div className="text-sm text-zinc-400 mt-3">
                      {hour}
                    </div>
                  </div>
                )
              },
            )}
          </div>
        )}
      </div>
    </div>
  )
}