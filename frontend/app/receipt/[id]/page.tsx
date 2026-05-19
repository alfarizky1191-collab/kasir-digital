'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

type OrderItem = {
  name: string
  qty: number
  price: number
}

type Order = {
  id: string
  customerName: string
  tableNumber?: string | null
  paymentMethod?: string
  paymentAmount?: number | null
  changeAmount?: number | null
  total: number
  createdAt: string
  items: OrderItem[]
}

export default function ReceiptPage() {
  const params = useParams()
  const search = useSearchParams()

  const id = params.id

  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/orders/history')

        if (!response.ok) return

        const data = await response.json()

        const found = data.find((o: Order) => o.id === id)

        if (!found) {
          setOrder(null)
          return
        }

        // if paid amount passed via query param, prefer that for printing
        const paidParam = search?.get('paid')

        if (paidParam && !found.paymentAmount) {
          const paid = Number(paidParam)

          found.paymentAmount = Number.isFinite(paid) ? paid : undefined
          if (typeof found.paymentAmount === 'number') {
            found.changeAmount = found.paymentAmount - found.total
          }
        }

        setOrder(found)
      } catch (err) {
        console.error(err)
      }
    }

    fetchOrder()
  }, [id, search])

  useEffect(() => {
    if (order) {
      setTimeout(() => {
        try {
          window.print()
        } catch (err) {
          // ignore
        }
      }, 500)
    }
  }, [order])

  if (!order) {
    return <div className="p-10">Receipt not found</div>
  }

  return (
    <div className="bg-white text-black min-h-screen p-6 flex justify-center">
      <div className="w-[360px] text-sm font-sans">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold">NOIR POS</h1>
          <p className="text-xs mt-1">Premium Restaurant</p>
        </div>

        <div className="mb-3 text-xs">
          <div>Order: <span className="font-bold">{order.id}</span></div>
          <div>Table: <span className="font-bold">{order.tableNumber || (order.customerName.match(/\(Table\s*(\d+)\)/i)?.[1] ?? '-')}</span></div>
          <div>Date: {new Date(order.createdAt).toLocaleString('id-ID')}</div>
        </div>

        <div className="border-t border-b py-3 mb-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between mb-2">
              <div>
                <div className="font-bold">{item.name}</div>
                <div className="text-xs text-zinc-600">x{item.qty}</div>
              </div>
              <div className="text-right">
                Rp {(item.qty * item.price).toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>Rp {order.total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="mb-3 text-sm">
          <div className="flex justify-between">
            <div>Payment</div>
            <div className="font-bold">{order.paymentMethod || '-'}</div>
          </div>

          <div className="flex justify-between mt-2">
            <div>Paid</div>
            <div className="font-bold">Rp {(order.paymentAmount ?? 0).toLocaleString('id-ID')}</div>
          </div>

          <div className="flex justify-between mt-2">
            <div>Change</div>
            <div className={`font-bold ${(order.changeAmount ?? 0) < 0 ? 'text-red-500' : 'text-green-600'}`}>
              Rp {(order.changeAmount ?? 0).toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs">Thank you for dining with us!</div>
      </div>
    </div>
  )
}