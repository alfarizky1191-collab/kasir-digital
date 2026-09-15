'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useState } from 'react'

import { apiRequest } from '@/lib/client-api'

type AuthResponse = {
  success: boolean
  needsEmailConfirmation?: boolean
}

function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return

    setPending(true)
    setMessage('')

    try {
      const result = await apiRequest<AuthResponse>(
        `/api/auth/${mode}`,
        {
          method: 'POST',
          body: JSON.stringify({
            displayName,
            email,
            password,
          }),
        },
      )

      if (result.needsEmailConfirmation) {
        setMessage(
          'Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.',
        )
        setMode('login')
        return
      }

      const next = search.get('next')
      router.replace(next && next.startsWith('/') ? next : '/access')
      router.refresh()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Gagal masuk',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-7 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-400">
          Kasir Digital
        </p>
        <h1 className="mt-3 text-4xl font-black">
          {mode === 'login' ? 'Masuk ke POS' : 'Buat akun staf'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Akun baru harus disetujui owner. Pengguna pertama dapat
          mengaktifkan akun owner.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Nama
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
                autoComplete="name"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">
              Password
            </span>
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3"
              autoComplete={
                mode === 'login'
                  ? 'current-password'
                  : 'new-password'
              }
            />
          </label>

          {message && (
            <p
              role="status"
              className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-200"
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
              : mode === 'login'
                ? 'Masuk'
                : 'Daftar'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMessage('')
            setMode(mode === 'login' ? 'signup' : 'login')
          }}
          className="mt-5 w-full text-sm font-bold text-zinc-400 hover:text-white"
        >
          {mode === 'login'
            ? 'Belum punya akun? Daftar'
            : 'Sudah punya akun? Masuk'}
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
