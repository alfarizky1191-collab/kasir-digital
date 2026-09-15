'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import {
  apiRequest,
  formatRupiah,
} from '@/lib/client-api'

type Summary = {
  net_revenue: number
  today_revenue: number
  transaction_count: number
  items_sold: number
  low_stock_count: number
  top_products: { name: string; quantity: number }[]
}

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [message, setMessage] = useState('Memuat ringkasan...')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      apiRequest<Summary>('/api/admin/summary')
        .then((data) => {
          if (active) {
            setSummary(data)
            setMessage('')
          }
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

  const cards = summary
    ? [
        {
          label: 'Pendapatan bersih',
          value: formatRupiah(summary.net_revenue),
        },
        {
          label: 'Pendapatan hari ini',
          value: formatRupiah(summary.today_revenue),
        },
        {
          label: 'Transaksi',
          value: String(summary.transaction_count),
        },
        {
          label: 'Item terjual',
          value: String(summary.items_sold),
        },
        {
          label: 'Stok menipis',
          value: String(summary.low_stock_count),
        },
      ]
    : []

  const links = [
    {
      href: '/admin/products',
      title: 'Produk & Stok',
      body: 'Atur harga, ketersediaan, dan jumlah stok.',
    },
    {
      href: '/admin/staff',
      title: 'Akses Staf',
      body: 'Setujui akun dan tentukan role.',
    },
    {
      href: '/admin/qr',
      title: 'Meja & QR',
      body: 'Atur kode meja dan cetak QR.',
    },
    {
      href: '/admin/settings',
      title: 'Pengaturan',
      body: 'Atur nama usaha dan QRIS manual.',
    },
    {
      href: '/audit',
      title: 'Audit Log',
      body: 'Lihat perubahan sensitif yang dicatat server.',
    },
    {
      href: '/history',
      title: 'Riwayat & Refund',
      body: 'Periksa transaksi dan proses refund.',
    },
  ]

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <p className="text-sm font-black uppercase tracking-wider text-orange-400">
        Owner dashboard
      </p>
      <h1 className="mt-2 text-5xl font-black">Ringkasan Usaha</h1>

      {message && (
        <p className="my-6 rounded-2xl bg-zinc-900 p-4">
          {message}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
          >
            <p className="text-sm text-zinc-500">{card.label}</p>
            <p className="mt-3 break-words text-2xl font-black text-orange-400">
              {card.value}
            </p>
          </article>
        ))}
      </div>

      {summary && summary.top_products.length > 0 && (
        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-2xl font-black">Produk terlaris</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {summary.top_products.map((product, index) => (
              <div
                key={product.name}
                className="rounded-2xl bg-black p-4"
              >
                <p className="text-sm text-zinc-500">
                  #{index + 1}
                </p>
                <p className="mt-1 font-black">{product.name}</p>
                <p className="mt-2 text-orange-400">
                  {product.quantity} terjual
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-orange-500"
          >
            <h2 className="text-2xl font-black">{link.title}</h2>
            <p className="mt-2 leading-6 text-zinc-400">
              {link.body}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
