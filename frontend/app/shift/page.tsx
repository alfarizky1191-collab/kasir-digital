'use client'

import { FormEvent, useEffect, useState } from 'react'

import {
  apiRequest,
  formatRupiah,
} from '@/lib/client-api'
import type { Shift } from '@/lib/types'

type ActiveResponse = { data: Shift | null }

export default function ShiftPage() {
  const [shift, setShift] = useState<Shift | null>(null)
  const [openingCash, setOpeningCash] = useState('')
  const [actualCash, setActualCash] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('Memuat shift...')
  const [pending, setPending] = useState(false)

  const load = () =>
    apiRequest<ActiveResponse>('/api/shifts/active').then(
      (data) => {
        setShift(data.data)
        setMessage('')
      },
    )

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      apiRequest<ActiveResponse>('/api/shifts/active')
        .then((data) => {
          if (active) {
            setShift(data.data)
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

  const open = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setMessage('')
    try {
      await apiRequest('/api/shifts/open', {
        method: 'POST',
        body: JSON.stringify({
          openingCash: Number(openingCash),
        }),
      })
      setOpeningCash('')
      await load()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Gagal membuka shift',
      )
    } finally {
      setPending(false)
    }
  }

  const close = async (event: FormEvent) => {
    event.preventDefault()
    if (!shift) return

    if (
      !window.confirm(
        'Tutup shift? Semua order harus selesai atau sudah di-void.',
      )
    ) {
      return
    }

    setPending(true)
    setMessage('')
    try {
      const result = await apiRequest<{
        data: Shift
      }>('/api/shifts/close', {
        method: 'POST',
        body: JSON.stringify({
          shiftId: shift.id,
          actualCash: Number(actualCash),
          notes,
        }),
      })
      setShift(null)
      setActualCash('')
      setNotes('')
      setMessage(
        `Shift ditutup. Selisih kas: ${formatRupiah(result.data.difference || 0)}`,
      )
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Gagal menutup shift',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <p className="text-sm font-black uppercase tracking-wider text-orange-400">
        Cash control
      </p>
      <h1 className="mt-2 text-5xl font-black">Shift Kasir</h1>

      {message && (
        <p
          role="status"
          className="my-6 rounded-2xl bg-zinc-900 p-4 text-zinc-300"
        >
          {message}
        </p>
      )}

      {!shift ? (
        <form
          onSubmit={open}
          className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <h2 className="text-2xl font-black">Buka shift baru</h2>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold">
              Modal kas awal
            </span>
            <input
              required
              type="number"
              min={0}
              value={openingCash}
              onChange={(event) =>
                setOpeningCash(event.target.value)
              }
              className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-4"
            />
          </label>
          <button
            disabled={pending}
            className="mt-5 w-full rounded-2xl bg-orange-500 py-4 font-black text-black disabled:opacity-50"
          >
            Buka Shift
          </button>
        </form>
      ) : (
        <form
          onSubmit={close}
          className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-black p-5">
              <p className="text-sm text-zinc-500">Kasir</p>
              <p className="mt-2 text-2xl font-black">
                {shift.cashier_name}
              </p>
            </div>
            <div className="rounded-2xl bg-black p-5">
              <p className="text-sm text-zinc-500">Modal awal</p>
              <p className="mt-2 text-2xl font-black text-orange-400">
                {formatRupiah(shift.opening_cash)}
              </p>
            </div>
          </div>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold">
              Kas aktual saat tutup
            </span>
            <input
              required
              type="number"
              min={0}
              value={actualCash}
              onChange={(event) => setActualCash(event.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-4"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-bold">
              Catatan
            </span>
            <textarea
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="h-28 w-full rounded-2xl border border-zinc-700 bg-black px-4 py-4"
            />
          </label>
          <button
            disabled={pending}
            className="mt-5 w-full rounded-2xl bg-red-700 py-4 font-black disabled:opacity-50"
          >
            Tutup Shift
          </button>
        </form>
      )}
    </div>
  )
}
