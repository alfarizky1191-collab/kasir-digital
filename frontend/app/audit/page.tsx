'use client'

import { useEffect, useState } from 'react'

type AuditLog = {
  id: string
  action: string
  reason?: string
  orderId?: string
  cashierName: string
  createdAt: string
}

export default function AuditPage() {
  const [logs, setLogs] = useState<
    AuditLog[]
  >([])

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/audit',
      )

      const data = await response.json()

      if (Array.isArray(data)) {
        setLogs(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="mb-10">
        <h1 className="text-3xl md:text-6xl font-black">
          Audit Log
        </h1>

        <p className="text-zinc-400 mt-2">
          Void / Refund / Cancel Tracking
        </p>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="border border-dashed border-zinc-700 rounded-3xl h-[300px] flex items-center justify-center">
            <p className="text-zinc-500">
              No audit logs
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-2xl font-bold uppercase text-sm">
                      {log.action}
                    </div>

                    {log.orderId && (
                      <div className="text-zinc-400">
                        {log.orderId}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-zinc-300">
                      Cashier:
                      {' '}
                      <span className="font-bold">
                        {log.cashierName}
                      </span>
                    </p>

                    {log.reason && (
                      <p className="text-zinc-500 mt-2">
                        Reason:
                        {' '}
                        {log.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-zinc-500 text-sm">
                  {new Date(
                    log.createdAt,
                  ).toLocaleString(
                    'id-ID',
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}