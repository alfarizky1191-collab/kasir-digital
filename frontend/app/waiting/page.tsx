'use client'

import { Suspense, useEffect, useState } from 'react'

import {
  useRouter,
  useSearchParams,
} from 'next/navigation'

import { socket } from '../lib/socket'

function WaitingContent() {
  const router = useRouter()

  const searchParams =
    useSearchParams()

  const orderId =
    searchParams.get('id')

  const [status, setStatus] =
    useState('pending')

  useEffect(() => {
    const handleOrderUpdated = (
      order: any
    ) => {
      if (order.id !== orderId)
        return

      setStatus(order.status)

      if (order.status === 'done') {
        setTimeout(() => {
          router.push('/done')
        }, 1500)
      }
    }

    socket.on(
      'order-updated',
      handleOrderUpdated
    )

    return () => {
      socket.off(
        'order-updated',
        handleOrderUpdated
      )
    }
  }, [router, orderId])

  const statusColor =
    status === 'pending'
      ? 'text-orange-400'
      : status === 'cooking'
      ? 'text-yellow-400'
      : 'text-green-400'

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mb-8 inline-flex h-24 w-24 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />

        <h1 className="text-6xl font-black">
          Preparing Your Order
        </h1>

        <p className="mt-4 text-lg text-white/50">
          Kitchen sedang menyiapkan
          pesanan...
        </p>

        <div
          className={`mt-8 text-3xl font-black uppercase ${statusColor}`}
        >
          {status}
        </div>

        <p className="mt-4 text-orange-400">
          Order {orderId}
        </p>
      </div>
    </main>
  )
}

export default function WaitingPage() {
  return (
    <Suspense fallback={null}>
      <WaitingContent />
    </Suspense>
  )
}