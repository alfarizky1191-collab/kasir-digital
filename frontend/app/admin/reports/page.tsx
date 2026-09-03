'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'

type Report = { orders: number; revenue: number; refundTotal: number; averageOrder: number; cashRevenue: number; qrisRevenue: number; topProducts: { name: string; qty: number; revenue: number }[] }

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 8)}01`
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [report, setReport] = useState<Report | null>(null)

  const load = useCallback(async (event?: FormEvent) => {
    event?.preventDefault()
    const response = await fetch(`/api/reports/summary?from=${from}&to=${to}`, { cache: 'no-store' })
    if (response.ok) setReport(await response.json())
  }, [from, to])
  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  return <main className="mx-auto min-h-screen max-w-6xl p-4 text-white md:p-8">
    <h1 className="text-4xl font-black">Laporan Penjualan</h1>
    <form onSubmit={load} className="mt-6 flex flex-wrap gap-3"><input aria-label="Tanggal awal" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl bg-zinc-900 p-3" /><input aria-label="Tanggal akhir" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl bg-zinc-900 p-3" /><button className="rounded-xl bg-orange-500 px-5 font-black text-black">Tampilkan</button></form>
    {report ? <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      ['Omzet', report.revenue], ['Transaksi', report.orders], ['Rata-rata', report.averageOrder], ['Refund', report.refundTotal],
    ].map(([label, value]) => <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><p className="text-zinc-400">{label}</p><strong className="mt-2 block text-2xl">{label === 'Transaksi' ? value : `Rp ${Number(value).toLocaleString('id-ID')}`}</strong></div>)}</div>
    <div className="mt-6 grid gap-6 md:grid-cols-2"><section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"><h2 className="text-xl font-black">Metode Pembayaran</h2><p className="mt-4">Tunai: Rp {report.cashRevenue.toLocaleString('id-ID')}</p><p>QRIS: Rp {report.qrisRevenue.toLocaleString('id-ID')}</p></section><section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"><h2 className="text-xl font-black">Produk Terlaris</h2>{report.topProducts.map((item) => <p key={item.name} className="mt-3 flex justify-between"><span>{item.name}</span><strong>{item.qty} pcs</strong></p>)}</section></div></> : <p className="mt-8 text-zinc-400">Memuat laporan...</p>}
  </main>
}
