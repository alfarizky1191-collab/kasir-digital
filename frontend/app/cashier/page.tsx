'use client'

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

type OrderItem = {
  name: string
  qty: number
  price: number
}

type Order = {
  id: string
  customerName: string
  tableNumber?: string | null
  total: number
  paymentStatus: 'unpaid' | 'paid'
  items: OrderItem[]
}

export default function CashierPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedOrder, setSelectedOrder] =
    useState<string | null>(null)

  const [payModalOrder, setPayModalOrder] =
    useState<string | null>(null)

  const [payAmount, setPayAmount] =
    useState('')

  const [reason, setReason] =
    useState('')

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/orders/cashier',
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

    const socket = io(
      'http://localhost:3001',
    )

    socket.on('ordersUpdated', () => {
      fetchOrders()
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const payOrder = async (
    id: string,
    paymentMethod: 'cash' | 'qris',
    paymentAmount?: number,
  ) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/orders/${id}/payment`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            paymentMethod,
            paymentAmount,
          }),
        },
      )

      if (!response.ok) {
        const text = await response.text()

        console.error('PAYMENT API ERROR:', text)

        throw new Error(text || 'Payment failed')
      }

      setOrders((prev) => prev.filter((order) => order.id !== id))

      // close any pay modal for this order
      if (payModalOrder === id) {
        setPayModalOrder(null)
        setPayAmount('')
      }

      const paidQuery = paymentAmount ? `?paid=${encodeURIComponent(String(paymentAmount))}` : ''

      window.open(`/receipt/${id}${paidQuery}`, '_blank')
    } catch (error) {
      console.error(error)

      window.alert(
        'Payment gagal',
      )
    }
  }

  const createAuditLog = async (
    action: string,
    orderId: string,
  ) => {
    try {
      await fetch(
        'http://localhost:3001/api/audit',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            action,
            orderId,
            cashierName: 'Alfa',
            reason,
          }),
        },
      )

      setSelectedOrder(null)

      setReason('')

      window.alert(
        `${action} berhasil`,
      )
    } catch (error) {
      console.error(error)
    }
  }

  const getTotalOrders = () => {
    return orders.length
  }

  const getGrandTotal = () => {
    return orders.reduce(
      (acc, order) => acc + order.total,
      0,
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl">
        Loading cashier...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-40">
      <div className="mb-8 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-6xl font-black">
            Cashier Dashboard
          </h1>

          <p className="text-zinc-400 mt-2 text-sm md:text-lg">
            Live Payment Queue
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 min-w-[160px]">
            <p className="text-zinc-400 text-sm">
              Orders
            </p>

            <h2 className="text-3xl md:text-4xl font-black mt-2">
              {getTotalOrders()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 min-w-[160px]">
            <p className="text-zinc-400 text-sm">
              Revenue
            </p>

            <h2 className="text-xl md:text-3xl font-black mt-2 text-orange-400">
              Rp{' '}
              {getGrandTotal().toLocaleString(
                'id-ID',
              )}
            </h2>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="h-[60vh] flex items-center justify-center border border-dashed border-zinc-700 rounded-3xl">
          <p className="text-zinc-500 text-xl">
            No Payment Queue
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black">
                    {order.customerName}
                  </h2>

                  <p className="text-zinc-500 mt-2">
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
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 px-5 py-4 rounded-2xl">
                  <p className="text-zinc-400 text-sm">
                    Total
                  </p>

                  <h2 className="text-2xl md:text-4xl font-black text-orange-400 mt-1">
                    Rp{' '}
                    {order.total.toLocaleString(
                      'id-ID',
                    )}
                  </h2>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {order.items.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="bg-black/40 rounded-2xl px-4 py-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-lg md:text-2xl font-bold">
                          {item.name}
                        </p>

                        <p className="text-zinc-500 text-sm mt-1">
                          Qty:
                          {' '}
                          {item.qty}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-orange-400 text-lg md:text-2xl font-black">
                          Rp{' '}
                          {(
                            item.qty *
                            item.price
                          ).toLocaleString(
                            'id-ID',
                          )}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setPayModalOrder(order.id)}
                  className="bg-green-600 hover:bg-green-700 active:scale-95 transition py-4 rounded-2xl text-lg md:text-xl font-black"
                >
                  Pay Cash
                </button>

                <button
                  onClick={() =>
                    payOrder(order.id, 'qris')
                  }
                  className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition py-4 rounded-2xl text-lg md:text-xl font-black"
                >
                  Pay QRIS
                </button>

                <button
                  onClick={() =>
                    setSelectedOrder(order.id)
                  }
                  className="bg-yellow-600 hover:bg-yellow-700 active:scale-95 transition py-4 rounded-2xl text-lg md:text-xl font-black"
                >
                  Void
                </button>

                <button
                  onClick={() =>
                    setSelectedOrder(order.id)
                  }
                  className="bg-red-600 hover:bg-red-700 active:scale-95 transition py-4 rounded-2xl text-lg md:text-xl font-black"
                >
                  Refund
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg">
            <h2 className="text-3xl font-black mb-6">
              Void / Refund
            </h2>

            <textarea
              placeholder="Reason..."
              value={reason}
              onChange={(e) =>
                setReason(
                  e.target.value,
                )
              }
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none h-32"
            />

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() =>
                  createAuditLog(
                    'void',
                    selectedOrder,
                  )
                }
                className="bg-yellow-600 hover:bg-yellow-700 py-4 rounded-2xl font-black"
              >
                Confirm Void
              </button>

              <button
                onClick={() =>
                  createAuditLog(
                    'refund',
                    selectedOrder,
                  )
                }
                className="bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-black"
              >
                Confirm Refund
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedOrder(null)

                setReason('')
              }}
              className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl font-black"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {payModalOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg">
            <h2 className="text-3xl font-black mb-4">Cash Payment</h2>

            {(() => {
              const order = orders.find(
                (o) => o.id === payModalOrder,
              )

              if (!order) return <p>Order not found</p>

              const total = order.total

              const bayar = Number(payAmount || 0)

              const change = bayar - total

              const quick = [5000, 10000, 20000, 50000, 100000]

              return (
                <>
                  <div className="mb-4">
                    <p className="text-zinc-400">Order</p>
                    <h3 className="text-2xl font-bold">{order.id}</h3>
                    <p className="text-zinc-500">{order.customerName}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-zinc-400">Total</p>
                    <h3 className="text-2xl font-black text-orange-400">Rp {total.toLocaleString('id-ID')}</h3>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {quick.map((q) => (
                        <button
                          key={q}
                          onClick={() => setPayAmount((p) => String(Number(p || 0) + q))}
                          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-2xl font-bold"
                        >
                          Rp {q.toLocaleString('id-ID')}
                        </button>
                      ))}

                      <button
                        onClick={() => setPayAmount('')}
                        className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-2xl font-bold"
                      >
                        Reset
                      </button>
                    </div>

                    <div>
                      <input
                        type="number"
                        placeholder="Masukkan nominal"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between">
                      <div className="text-zinc-400">Bayar</div>
                      <div className="font-bold">Rp {Number(bayar).toLocaleString('id-ID')}</div>
                    </div>

                    <div className="flex justify-between mt-2">
                      <div className="text-zinc-400">Kembali</div>
                      <div className={`font-bold ${change < 0 ? 'text-red-500' : 'text-green-400'}`}>
                        {change < 0 ? '-' : ''}Rp {Math.abs(change).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPayModalOrder(null)}
                      className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-2xl font-black"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => {
                        if (change < 0) {
                          window.alert('Uang tidak cukup')
                          return
                        }

                        payOrder(order.id, 'cash', bayar)
                      }}
                      className="bg-green-600 hover:bg-green-700 py-3 rounded-2xl font-black"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
