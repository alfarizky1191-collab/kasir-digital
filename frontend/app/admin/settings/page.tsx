'use client'

import { FormEvent, useEffect, useState } from 'react'

import { apiRequest } from '@/lib/client-api'

type Settings = {
  business_name: string
  qris_image_url: string | null
}

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('')
  const [qrisImageUrl, setQrisImageUrl] = useState('')
  const [message, setMessage] = useState('Memuat pengaturan...')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      apiRequest<Settings | null>('/api/settings')
        .then((settings) => {
          if (!active) return
          setBusinessName(settings?.business_name || 'Kasir Digital')
          setQrisImageUrl(settings?.qris_image_url || '')
          setMessage('')
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

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setMessage('')
    try {
      await apiRequest('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ businessName, qrisImageUrl }),
      })
      setMessage('Pengaturan tersimpan.')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Pengaturan gagal disimpan',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <p className="text-sm font-black uppercase tracking-wider text-orange-400">
        Configuration
      </p>
      <h1 className="mt-2 text-5xl font-black">Pengaturan</h1>

      <form
        onSubmit={save}
        className="mt-8 space-y-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
      >
        <label className="block">
          <span className="mb-2 block text-sm font-bold">
            Nama usaha
          </span>
          <input
            required
            minLength={2}
            maxLength={100}
            value={businessName}
            onChange={(event) =>
              setBusinessName(event.target.value)
            }
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold">
            URL gambar QRIS
          </span>
          <input
            type="url"
            value={qrisImageUrl}
            onChange={(event) =>
              setQrisImageUrl(event.target.value)
            }
            placeholder="https://..."
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
          />
          <span className="mt-2 block text-xs leading-5 text-zinc-500">
            Pembayaran QRIS tetap harus dikonfirmasi kasir setelah
            mutasi pembayaran terlihat.
          </span>
        </label>
        {message && (
          <p role="status" className="rounded-xl bg-black p-3">
            {message}
          </p>
        )}
        <button
          disabled={pending}
          className="rounded-xl bg-orange-500 px-6 py-3 font-black text-black disabled:opacity-50"
        >
          Simpan
        </button>
      </form>
    </div>
  )
}
