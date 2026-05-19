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
  paymentMethod?: string
  total: number
  createdAt: string
  items: OrderItem[]
}

export default function ReceiptPage({
  params,
}: {
  params: {
    id: string
  }
}) {
  const [order, setOrder] =
    useState<Order | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/orders/history',
      )

      const data = await response.json()

      const found = data.find(
        (item: Order) =>
          item.id === params.id,
      )

      setOrder(found || null)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (order) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [order])

  if (!order) {
    return (
      <div className="p-10">
        Receipt not found
      </div>
    )
  }

  return (
    <div className="bg-white text-black min-h-screen flex justify-center">
      <div className="w-[320px] p-5 text-sm">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold">
            NOIR POS
          </h1>

          <p>
            Premium Restaurant
          </p>
        </div>

        <div className="mb-4">
          <p>Order: {order.id}</p>

          <p>
            Customer:
            {' '}
            {order.customerName}
          </p>

          <p>
            Payment:
            {' '}
            {order.paymentMethod}
          </p>

          <p>
            {new Date(
              order.createdAt,
            ).toLocaleString('id-ID')}
          </p>
        </div>

        <div className="border-t border-b py-4 space-y-2">
          {order.items.map(
            (item, index) => (
              <div
                key={index}
                className="flex justify-between"
              >
                <div>
                  {item.name} x
                  {item.qty}
                </div>

                <div>
                  Rp{' '}
                  {(
                    item.qty *
                    item.price
                  ).toLocaleString(
                    'id-ID',
                  )}
                </div>
              </div>
            ),
          )}
        </div>

        <div className="pt-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>

            <span>
              Rp{' '}
              {order.total.toLocaleString(
                'id-ID',
              )}
            </span>
          </div>
        </div>

        <div className="text-center mt-10 text-xs">
          Thank you for dining with us!
        </div>
      </div>
    </div>
  )
}