'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

import { apiRequest } from '@/lib/client-api'
import type { StaffProfile } from '@/lib/types'

type MeResponse = {
  user: { id: string; email?: string }
  staff: StaffProfile | null
  hasOwner: boolean
}

function destination(role: StaffProfile['role']) {
  if (role === 'owner') return '/admin'
  if (role === 'kitchen') return '/kitchen'
  return '/shift'
}

export default function AccessPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('Memeriksa akses...')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      apiRequest<MeResponse>('/api/auth/me')
        .then((data) => {
          if (!active) return
          if (data.staff?.active && data.staff.role) {
            router.replace(destination(data.staff.role))
            return
          }
          setMe(data)
          setDisplayName(data.staff?.display_name || '')
          setMessage(
            data.staff
              ? 'Permintaan akses menunggu persetujuan owner.'
              : '',
          )
        })
        .catch(() => {
          if (active) router.replace('/login')
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [router])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!me || pending) return

    setPending(true)
    setMessage('')

    try {
      await apiRequest('/api/auth/access', {
        method: 'POST',
        body: JSON.stringify({
          displayName,
          action: me.hasOwner ? 'request' : 'claim-owner',
        }),
      })
      if (me.hasOwner) {
        setMessage(
          'Permintaan sudah dikirim. Owner perlu mengaktifkan akun ini.',
        )
      } else {
        router.replace('/admin')
        router.refresh()
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Akses gagal diproses',
      )
    } finally {
      setPending(false)
    }
  }

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-400">
        {message}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
        <p className="text-sm font-black uppercase tracking-wider text-orange-400">
          Pengaturan akses
        </p>
        <h1 className="mt-3 text-4xl font-black">
          {me.hasOwner
            ? 'Minta akses staf'
            : 'Aktifkan owner pertama'}
        </h1>
        <p className="mt-3 text-zinc-400">{me.user.email}</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold">
              Nama tampilan
            </span>
            <input
              required
              minLength={2}
              maxLength={80}
              value={displayName}
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
              className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3"
            />
          </label>
          {message && (
            <p
              role="status"
              className="rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-300"
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-orange-500 px-5 py-4 font-black text-black disabled:opacity-50"
          >
            {pending
              ? 'Memproses...'
              : me.hasOwner
                ? 'Kirim permintaan'
                : 'Jadikan saya owner'}
          </button>
        </form>
      </div>
    </div>
  )
}
