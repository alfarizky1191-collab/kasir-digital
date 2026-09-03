'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Login gagal')
      const requested = search.get('next')
      const fallback = result.user.role === 'kitchen' ? '/kitchen' : result.user.role === 'cashier' ? '/cashier' : '/admin'
      router.replace(requested?.startsWith('/') ? requested : fallback)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070707] p-4 text-white">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-400">NOIR POS</p>
        <h1 className="mt-3 text-4xl font-black">Masuk ke Kasir</h1>
        <p className="mt-2 text-zinc-400">Gunakan akun yang diberikan pemilik usaha.</p>

        <label className="mt-8 block text-sm font-bold" htmlFor="username">Username</label>
        <input id="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-orange-500" />

        <label className="mt-5 block text-sm font-bold" htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-orange-500" />

        {error ? <p role="alert" className="mt-4 rounded-xl bg-red-950 p-3 text-sm text-red-200">{error}</p> : null}
        <button disabled={loading} className="mt-6 w-full rounded-2xl bg-orange-500 py-4 font-black text-black disabled:opacity-50">
          {loading ? 'Memeriksa...' : 'Masuk'}
        </button>
      </form>
    </main>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen bg-black" />}><LoginForm /></Suspense>
}
