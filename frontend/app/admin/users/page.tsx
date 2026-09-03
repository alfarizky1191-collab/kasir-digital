'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'

type User = { id: string; username: string; name: string; role: string; isActive: boolean }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({ username: '', name: '', password: '', role: 'cashier' })
  const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    const response = await fetch('/api/users', { cache: 'no-store' })
    if (response.ok) setUsers(await response.json())
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  async function create(event: FormEvent) {
    event.preventDefault(); setMessage('')
    const response = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const result = await response.json()
    if (!response.ok) { setMessage(result.message || 'Gagal membuat akun'); return }
    setForm({ username: '', name: '', password: '', role: 'cashier' }); setMessage('Akun berhasil dibuat'); await load()
  }

  async function toggle(user: User) {
    await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }) })
    await load()
  }

  return <main className="mx-auto min-h-screen max-w-5xl p-4 text-white md:p-8">
    <h1 className="text-4xl font-black">Pengguna & Role</h1>
    <form onSubmit={create} className="mt-8 grid gap-3 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:grid-cols-2">
      <input required minLength={3} placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="rounded-xl bg-black p-3" />
      <input required placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl bg-black p-3" />
      <input required minLength={8} type="password" placeholder="Password minimal 8 karakter" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl bg-black p-3" />
      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-xl bg-black p-3"><option value="cashier">Kasir</option><option value="kitchen">Dapur</option><option value="admin">Admin</option></select>
      <button className="rounded-xl bg-orange-500 p-3 font-black text-black">Buat Akun</button>{message ? <p role="status" className="p-3 text-orange-300">{message}</p> : null}
    </form>
    <div className="mt-6 space-y-3">{users.map((user) => <div key={user.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4"><div><strong>{user.name}</strong><p className="text-sm text-zinc-400">@{user.username} · {user.role}</p></div><button onClick={() => toggle(user)} className="rounded-xl bg-zinc-800 px-4 py-2">{user.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button></div>)}</div>
  </main>
}
