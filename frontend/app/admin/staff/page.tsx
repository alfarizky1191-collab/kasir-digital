'use client'

import { useEffect, useState } from 'react'

import { apiRequest } from '@/lib/client-api'
import type {
  StaffProfile,
  StaffRole,
} from '@/lib/types'

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [message, setMessage] = useState('Memuat staf...')

  const load = () =>
    apiRequest<StaffProfile[]>('/api/staff').then((data) => {
      setStaff(data)
      setMessage('')
    })

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      apiRequest<StaffProfile[]>('/api/staff')
        .then((data) => {
          if (active) {
            setStaff(data)
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

  const update = async (
    userId: string,
    role: StaffRole,
    active: boolean,
  ) => {
    try {
      await apiRequest('/api/staff', {
        method: 'PATCH',
        body: JSON.stringify({ userId, role, active }),
      })
      await load()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Update gagal',
      )
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <p className="text-sm font-black uppercase tracking-wider text-orange-400">
        Role-based access
      </p>
      <h1 className="mt-2 text-5xl font-black">Akses Staf</h1>
      <p className="mt-4 max-w-2xl text-zinc-400">
        Kitchen hanya mengelola proses masak. Cashier mengelola shift,
        pembayaran, dan void. Refund serta pengaturan hanya untuk owner.
      </p>

      {message && (
        <p className="my-6 rounded-2xl bg-zinc-900 p-4">
          {message}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {staff.map((person) => (
          <article
            key={person.user_id}
            className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-black">
                {person.display_name}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {person.active
                  ? `Aktif · ${person.role}`
                  : 'Menunggu / nonaktif'}
              </p>
            </div>
            <select
              aria-label={`Role ${person.display_name}`}
              value={person.role || 'cashier'}
              onChange={(event) =>
                update(
                  person.user_id,
                  event.target.value as StaffRole,
                  person.active,
                )
              }
              className="rounded-xl border border-zinc-700 bg-black px-3 py-3"
            >
              <option value="cashier">Cashier</option>
              <option value="kitchen">Kitchen</option>
              <option value="owner">Owner</option>
            </select>
            <button
              type="button"
              onClick={() =>
                update(
                  person.user_id,
                  person.role || 'cashier',
                  !person.active,
                )
              }
              className={
                person.active
                  ? 'rounded-xl bg-red-800 px-4 py-3 font-bold'
                  : 'rounded-xl bg-green-700 px-4 py-3 font-bold'
              }
            >
              {person.active ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
