'use client'

import { useEffect, useState } from 'react'

type OrderItem = {
  name: string
  qty: number
  price: number
}

type Order = {
  id: string
  customerName: string
  tableNumber?: string | null
  status: string
  paymentStatus: 'paid'
  paymentMethod?: 'cash' | 'qris'
  total: number
  createdAt: string
  items: OrderItem[]
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
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
    fetchHistory()

    const interval = setInterval(() => {
      fetchHistory()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        Loading history...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold mb-8">
        Transaction History
      </h1>

      {orders.length === 0 ? (
        <p>No paid orders</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-zinc-700 rounded-2xl p-6"
            >
              <div className="flex justify-between mb-5">
                <div>
                  <h2 className="text-3xl font-bold">
                    {order.customerName}
                  </h2>

                  <p className="text-zinc-400">
                    {order.id}
                    {order.tableNumber ? (
                      <span className="ml-2">• Table {order.tableNumber}</span>
                    ) : (() => {
                      const m = /\(Table\s*(\d+)\)/i.exec(order.customerName)

                      if (m) {
                        return <span className="ml-2">• Table {m[1]}</span>
                      }

                      return null
                    })()}
                  </p>

                  <p className="text-zinc-500 text-sm mt-1">
                    {new Date(
                      order.createdAt,
                    ).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-green-400 font-bold uppercase">
                    {order.paymentMethod}
                  </p>

                  <p className="text-orange-400 text-2xl font-bold mt-2">
                    Rp{' '}
                    {order.total.toLocaleString(
                      'id-ID',
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex justify-between"
                    >
                      <span>
                        {item.name} x
                        {item.qty}
                      </span>

                      <span>
                        Rp{' '}
                        {(
                          item.qty *
                          item.price
                        ).toLocaleString(
                          'id-ID',
                        )}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
