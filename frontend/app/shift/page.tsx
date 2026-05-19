'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Shift = {
  id: string
  cashierName: string
  openingCash: number
  actualCash?: number
  expectedCash?: number
  difference?: number
  status: string
}

export default function ShiftPage() {
  const [shift, setShift] =
    useState<Shift | null>(null)

  const [openingCash, setOpeningCash] =
    useState('')

  const [actualCash, setActualCash] =
    useState('')

  const [notes, setNotes] =
    useState('')

  const [salesToday, setSalesToday] = useState(0)

  const fetchShift = async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/shifts/active',
      )

      if (!response.ok) {
        const text = await response.text()
        console.error('fetchShift failed', response.status, text)
        return
      }

      // read text first to avoid Unexpected end of JSON input
      const text = await response.text()

      if (!text || !text.trim()) {
        // empty body -> treat as no active shift
        setShift(null)
        return
      }

      let parsed: any = null

      try {
        parsed = JSON.parse(text)
      } catch (err) {
        console.error('fetchShift: invalid JSON', err, text)
        setShift(null)
        return
      }

      if (parsed && parsed.success) {
        setShift(parsed.data)
      } else {
        console.error('fetchShift: unexpected payload', parsed)
        setShift(null)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchShift()
    fetchSalesToday()
  }, [])

  const router = useRouter()

  const fetchSalesToday = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders/history')

      if (!res.ok) return

      const all = await res.json()

      const today = new Date()
      const sum = all.reduce((acc: number, o: any) => {
        const d = new Date(o.createdAt)
        if (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        ) {
          return acc + (o.total || 0)
        }

        return acc
      }, 0)

      setSalesToday(sum)
    } catch (err) {
      console.error(err)
    }
  }

  const openShift = async () => {
    try {
      const cash = Number(openingCash) || 0

      if (!cash || cash <= 0) {
        alert('Please enter a valid opening cash amount')
        return
      }

      const ok = confirm(`Open shift with opening cash: Rp ${cash.toLocaleString('id-ID')} ?`)
      if (!ok) return

      const response = await fetch('http://localhost:3001/api/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashierName: 'Alfa', openingCash: cash }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('openShift failed', response.status, text)
        return
      }

      const ct = response.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const parsed = await response.json()

        if (parsed && parsed.success) {
          setShift(parsed.data)
        } else {
          console.error('openShift: unexpected payload', parsed)
        }
      } else {
        const text2 = await response.text()
        console.error('openShift: expected JSON, got:', text2)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const closeShift = async () => {
    if (!shift) return
    try {
      const actual = Number(actualCash) || 0
      const expectedCash = shift.openingCash + salesToday

      const diff = actual - expectedCash

      const summary = `Closing summary:\nOpening Cash: Rp ${shift.openingCash.toLocaleString('id-ID')}\nSales Today: Rp ${salesToday.toLocaleString('id-ID')}\nExpected Cash: Rp ${expectedCash.toLocaleString('id-ID')}\nActual Closing Cash: Rp ${actual.toLocaleString('id-ID')}\nDifference: Rp ${diff.toLocaleString('id-ID')}`

      const ok = confirm(summary + '\n\nProceed to close shift?')
      if (!ok) return

      const response = await fetch('http://localhost:3001/api/shifts/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId: shift.id, actualCash: actual, expectedCash, notes }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('closeShift failed', response.status, text)
        return
      }

      const ct2 = response.headers.get('content-type') || ''
      if (ct2.includes('application/json')) {
        await response.json()
      } else {
        const text = await response.text()
        console.error('closeShift: expected JSON, got:', text)
      }

      // reset and redirect to shift page to enforce next cashier opens shift
      setShift(null)

      setOpeningCash('')
      setActualCash('')
      setNotes('')

      router.replace('/shift')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="mb-10">
        <h1 className="text-3xl md:text-6xl font-black">
          Shift Management
        </h1>

        <p className="text-zinc-400 mt-2">
          Cashier Shift Control
        </p>
      </div>

      {!shift ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-xl">
          <h2 className="text-2xl font-black mb-6">
            Open Shift
          </h2>

          <div className="space-y-4">
            <input
              type="number"
              placeholder="Opening Cash"
              value={openingCash}
              onChange={(e) =>
                setOpeningCash(
                  e.target.value,
                )
              }
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none"
            />

            <button
              onClick={openShift}
              className="w-full bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl font-black text-lg"
            >
              Open Shift
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-black">
              Active Shift
            </h2>

            <p className="text-zinc-500 mt-2">
              {shift.cashierName}
            </p>
          </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-black/40 rounded-2xl p-5">
                  <p className="text-zinc-500">Opening Cash</p>

                  <h2 className="text-3xl font-black mt-3">Rp {shift.openingCash.toLocaleString('id-ID')}</h2>
                </div>

                <div className="bg-black/40 rounded-2xl p-5">
                  <p className="text-zinc-500">Sales Today</p>

                  <h2 className="text-3xl font-black mt-3 text-orange-400">Rp {salesToday.toLocaleString('id-ID')}</h2>
                </div>

                <div className="bg-black/40 rounded-2xl p-5">
                  <p className="text-zinc-500">Expected Cash</p>

                  <h2 className="text-3xl font-black mt-3 text-blue-400">Rp {(shift.openingCash + salesToday).toLocaleString('id-ID')}</h2>
                </div>

                <div className="bg-black/40 rounded-2xl p-5">
                  <p className="text-zinc-500">Status</p>

                  <h2 className="text-3xl font-black mt-3 text-green-400">OPEN</h2>
                </div>
              </div>

          <div className="space-y-4">
            <input
              type="number"
              placeholder="Actual Cash"
              value={actualCash}
              onChange={(e) =>
                setActualCash(
                  e.target.value,
                )
              }
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none"
            />

            <textarea
              placeholder="Closing Notes"
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              className="w-full bg-black border border-zinc-700 rounded-2xl px-4 py-4 outline-none h-32"
            />

            <button
              onClick={closeShift}
              className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-black text-lg"
            >
              Close Shift
            </button>
          </div>
        </div>
      )}
    </div>
  )
}