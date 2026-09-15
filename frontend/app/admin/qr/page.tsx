'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

import { apiRequest } from '@/lib/client-api'
import type { DiningTable } from '@/lib/types'

export default function TableQrPage() {
  const [tables, setTables] = useState<DiningTable[]>([])
  const [newCode, setNewCode] = useState('')
  const [message, setMessage] = useState('Memuat meja...')
  const baseUrl = useMemo(
    () =>
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : ''),
    [],
  )

  const load = () =>
    apiRequest<DiningTable[]>('/api/tables').then((data) => {
      setTables(data)
      setMessage('')
    })

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      apiRequest<DiningTable[]>('/api/tables')
        .then((data) => {
          if (active) {
            setTables(data)
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

  const save = async (
    table: Partial<DiningTable> & { code: string },
  ) => {
    try {
      await apiRequest('/api/tables', {
        method: 'POST',
        body: JSON.stringify({
          id: table.id || null,
          code: table.code,
          active: table.active !== false,
        }),
      })
      await load()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Meja gagal disimpan',
      )
    }
  }

  const add = async (event: FormEvent) => {
    event.preventDefault()
    await save({ code: newCode, active: true })
    setNewCode('')
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-orange-400">
            Table management
          </p>
          <h1 className="mt-2 text-5xl font-black">Meja & QR</h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-orange-500 px-5 py-3 font-black text-black"
        >
          Cetak QR
        </button>
      </div>

      <form
        onSubmit={add}
        className="no-print mt-8 flex max-w-md gap-3"
      >
        <input
          required
          pattern="[A-Za-z0-9-]{1,10}"
          value={newCode}
          onChange={(event) =>
            setNewCode(event.target.value.toUpperCase())
          }
          placeholder="Kode meja, contoh A11"
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black px-4 py-3"
        />
        <button className="rounded-xl bg-zinc-800 px-5 font-bold">
          Tambah
        </button>
      </form>

      {message && (
        <p className="no-print my-5 text-zinc-300">{message}</p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {tables.map((table) => {
          const url = `${baseUrl}/menu?table=${encodeURIComponent(table.code)}`

          return (
            <article
              key={table.id}
              className="rounded-3xl bg-white p-5 text-center text-black"
            >
              <h2 className="text-3xl font-black">
                Meja {table.code}
              </h2>
              <div className="mt-5 flex justify-center">
                <QRCodeSVG value={url} size={190} />
              </div>
              <p className="mt-4 break-all text-xs">{url}</p>
              <button
                type="button"
                onClick={() =>
                  save({ ...table, active: !table.active })
                }
                className="no-print mt-4 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
              >
                {table.active ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
