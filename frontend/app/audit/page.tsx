'use client'

import { useEffect, useState } from 'react'

import { apiRequest } from '@/lib/client-api'

type AuditLog = {
  id: number
  action: string
  entity_type: string
  entity_id: string | null
  reason: string | null
  metadata: Record<string, unknown>
  created_at: string
}

type AuditResponse = {
  data: AuditLog[]
  page: number
  hasMore: boolean
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [message, setMessage] = useState('Memuat audit...')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const load = (targetPage: number) =>
    apiRequest<AuditResponse>(
      `/api/audit?page=${targetPage}`,
    ).then((result) => {
      setLogs(result.data)
      setPage(result.page)
      setHasMore(result.hasMore)
      setMessage('')
    })

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      apiRequest<AuditResponse>('/api/audit?page=1')
        .then((result) => {
          if (!active) return
          setLogs(result.data)
          setPage(result.page)
          setHasMore(result.hasMore)
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

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <p className="text-sm font-black uppercase tracking-wider text-orange-400">
        Immutable activity
      </p>
      <h1 className="mt-2 text-5xl font-black">Audit Log</h1>

      {message && (
        <p className="my-6 rounded-2xl bg-zinc-900 p-4">
          {message}
        </p>
      )}

      <div className="mt-8 space-y-3">
        {logs.map((log) => (
          <article
            key={log.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-black text-orange-400">
                  {log.action}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {log.entity_type}
                  {log.entity_id ? ` · ${log.entity_id}` : ''}
                </p>
              </div>
              <time className="text-sm text-zinc-500">
                {new Date(log.created_at).toLocaleString('id-ID')}
              </time>
            </div>
            {log.reason && (
              <p className="mt-3 text-zinc-300">
                Alasan: {log.reason}
              </p>
            )}
          </article>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          disabled={page <= 1}
          onClick={() => load(page - 1)}
          className="rounded-xl bg-zinc-800 px-4 py-2 font-bold disabled:opacity-40"
        >
          Sebelumnya
        </button>
        <button
          disabled={!hasMore}
          onClick={() => load(page + 1)}
          className="rounded-xl bg-zinc-800 px-4 py-2 font-bold disabled:opacity-40"
        >
          Berikutnya
        </button>
      </div>
    </div>
  )
}
