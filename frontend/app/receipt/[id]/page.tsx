'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type OrderItem = {
  name: string
  qty: number
  price: number
}

type Order = {
  id: string
  customerName: string
  tableNumber?: string | null
  paymentStatus?: 'paid' | 'unpaid'
  paymentMethod?: string
  paymentAmount?: number | null
  changeAmount?: number | null
  total: number
  createdAt: string
  items: OrderItem[]
}

type FetchStatus = 'loading' | 'ready' | 'not-found' | 'error'

const STORE_NAME = 'NOIR POS'
const STORE_TAGLINE = 'Premium Restaurant'
const STORE_ADDRESS = 'Jl. Merdeka No. 1, Jakarta'

const formatRp = (n: number) =>
  `Rp ${Math.round(n).toLocaleString('id-ID')}`

export default function ReceiptPage() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()

  const id = params?.id

  const [order, setOrder] = useState<Order | null>(null)
  const [status, setStatus] = useState<FetchStatus>('loading')

  // Fetch order from existing history endpoint
  useEffect(() => {
    if (!id) return

    let active = true

    const fetchOrder = async () => {
      try {
        const response = await fetch(
          'http://localhost:3001/api/orders/history',
        )

        if (!response.ok) {
          if (active) setStatus('error')
          return
        }

        const data = await response.json()

        const found: Order | undefined = Array.isArray(data)
          ? data.find((o: Order) => o.id === id)
          : undefined

        if (!found) {
          if (active) {
            setOrder(null)
            setStatus('not-found')
          }
          return
        }

        // Allow ?paid=NNN passthrough (cashier flow) when API hasn't stored it
        const paidParam = search?.get('paid')

        if (paidParam && found.paymentAmount == null) {
          const paid = Number(paidParam)

          if (Number.isFinite(paid)) {
            found.paymentAmount = paid
            found.changeAmount = paid - found.total
          }
        }

        if (active) {
          setOrder(found)
          setStatus('ready')
        }
      } catch (err) {
        console.error(err)
        if (active) setStatus('error')
      }
    }

    fetchOrder()

    return () => {
      active = false
    }
  }, [id, search])

  // Optional auto print via ?autoprint=1
  useEffect(() => {
    if (status !== 'ready') return

    const auto = search?.get('autoprint')

    if (auto !== '1') return

    const timeout = setTimeout(() => {
      try {
        window.print()
      } catch {
        // ignore
      }
    }, 400)

    return () => clearTimeout(timeout)
  }, [status, search])

  const subtotal = useMemo(() => {
    if (!order) return 0
    return order.items.reduce(
      (sum, it) => sum + it.qty * it.price,
      0,
    )
  }, [order])

  // ---- LOADING STATE ----------------------------------------------------
  if (status === 'loading') {
    return (
      <div className="no-print min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-300 px-6">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-orange-400 animate-pulse" />
          <p className="text-lg font-medium">
            Loading receipt...
          </p>
        </div>
      </div>
    )
  }

  // ---- ERROR / NOT FOUND ------------------------------------------------
  if (status !== 'ready' || !order) {
    return (
      <div className="no-print min-h-screen flex items-center justify-center bg-zinc-950 text-white px-6">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-5">🧾</div>

          <h1 className="text-3xl font-black mb-2">
            Receipt not found
          </h1>

          <p className="text-zinc-400 mb-8 break-all">
            We couldn&apos;t locate an order with id{' '}
            <span className="font-mono text-zinc-200">
              {id}
            </span>
            .
          </p>

          <Link
            href="/history"
            className="inline-block bg-orange-500 hover:bg-orange-600 active:scale-95 transition px-6 py-3 rounded-2xl font-bold"
          >
            Back to History
          </Link>
        </div>
      </div>
    )
  }

  // ---- READY ------------------------------------------------------------
  const dateStr = new Date(order.createdAt).toLocaleString(
    'id-ID',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  )

  const tableNumber =
    order.tableNumber ||
    /\(Table\s*(\d+)\)/i.exec(order.customerName)?.[1] ||
    '-'

  const cleanCustomerName =
    order.customerName
      .replace(/\s*\(Table\s*\d+\)\s*/i, '')
      .trim() || 'Guest'

  const paymentStatusLabel = (
    order.paymentStatus || 'paid'
  ).toUpperCase()

  const paymentMethodLabel = (
    order.paymentMethod || '-'
  ).toUpperCase()

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8 flex flex-col items-center print:bg-white print:px-0 print:py-0">
      {/* TOOLBAR */}
      <div className="no-print w-full max-w-sm mb-6 flex items-center justify-between">
        <Link
          href="/history"
          className="text-sm text-zinc-400 hover:text-white transition"
        >
          ← Back
        </Link>

        <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Thermal 58mm
        </span>
      </div>

      {/* RECEIPT (also rendered in print) */}
      <div
        className="thermal-receipt bg-white text-black rounded-md shadow-2xl shadow-black/60 print:rounded-none print:shadow-none"
        style={{ width: '58mm' }}
      >
        <div
          className="px-3 py-4 print:px-2 print:py-3"
          style={{
            fontFamily:
              "'Courier New', ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: '11px',
            lineHeight: 1.45,
          }}
        >
          {/* HEADER */}
          <div className="text-center">
            <h1
              className="font-extrabold tracking-widest"
              style={{ fontSize: '15px', margin: 0 }}
            >
              {STORE_NAME}
            </h1>
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: '9px', margin: '2px 0 0' }}
            >
              {STORE_TAGLINE}
            </p>
            <p style={{ fontSize: '9px', margin: '2px 0 0' }}>
              {STORE_ADDRESS}
            </p>
          </div>

          <Divider />

          {/* META */}
          <div className="space-y-[2px]">
            <Row label="Order" value={order.id} bold />
            <Row label="Table" value={String(tableNumber)} bold />
            <Row
              label="Name"
              value={cleanCustomerName}
              ellipsis
            />
            <Row label="Date" value={dateStr} />
          </div>

          <Divider dashed />

          {/* ITEMS */}
          <div className="space-y-[6px]">
            {order.items.map((item, i) => (
              <div key={i} className="thermal-item">
                <div
                  className="font-bold"
                  style={{
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.name}
                </div>
                <div className="flex justify-between">
                  <span>
                    {item.qty} x{' '}
                    {item.price.toLocaleString('id-ID')}
                  </span>
                  <span className="font-bold">
                    {(
                      item.qty * item.price
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Divider dashed />

          {/* TOTALS */}
          <div className="space-y-[2px]">
            <Row
              label="Subtotal"
              value={formatRp(subtotal)}
            />
            <div
              className="flex justify-between font-extrabold"
              style={{
                fontSize: '13px',
                marginTop: '4px',
                borderTop: '1px solid #000',
                paddingTop: '4px',
              }}
            >
              <span>TOTAL</span>
              <span>{formatRp(order.total)}</span>
            </div>
          </div>

          <Divider />

          {/* PAYMENT */}
          <div className="space-y-[2px]">
            <Row
              label="Method"
              value={paymentMethodLabel}
              bold
            />
            <Row
              label="Status"
              value={paymentStatusLabel}
              bold
            />
            {typeof order.paymentAmount === 'number' && (
              <Row
                label="Paid"
                value={formatRp(order.paymentAmount)}
              />
            )}
            {typeof order.changeAmount === 'number' && (
              <Row
                label="Change"
                value={formatRp(order.changeAmount)}
              />
            )}
          </div>

          <Divider dashed />

          {/* FOOTER */}
          <div className="text-center">
            <p
              className="font-bold"
              style={{ margin: 0, fontSize: '11px' }}
            >
              Thank you for dining with us!
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '9px',
              }}
            >
              Please come again
            </p>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '9px',
                letterSpacing: '0.18em',
              }}
            >
              -- {order.id} --
            </p>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="no-print w-full max-w-sm mt-8 grid grid-cols-2 gap-3">
        <Link
          href="/history"
          className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition rounded-2xl py-4 text-center font-black"
        >
          Close
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="bg-orange-500 hover:bg-orange-600 active:scale-95 transition rounded-2xl py-4 font-black text-black"
        >
          Print Receipt
        </button>
      </div>

      <p className="no-print text-[11px] text-zinc-600 mt-4 text-center max-w-sm">
        Tip: append{' '}
        <span className="font-mono text-zinc-400">
          ?autoprint=1
        </span>{' '}
        to auto-print on open.
      </p>
    </div>
  )
}

// ----------------------------------------------------------------------
// Internal presentational helpers — kept in the same file to avoid
// touching unrelated parts of the codebase.
// ----------------------------------------------------------------------

function Divider({ dashed = false }: { dashed?: boolean }) {
  return (
    <div
      style={{
        margin: '6px 0',
        borderTop: `1px ${dashed ? 'dashed' : 'solid'} #000`,
      }}
    />
  )
}

function Row({
  label,
  value,
  bold = false,
  ellipsis = false,
}: {
  label: string
  value: string
  bold?: boolean
  ellipsis?: boolean
}) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span
        className={bold ? 'font-bold' : ''}
        style={
          ellipsis
            ? {
                maxWidth: '60%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }
            : undefined
        }
      >
        {value}
      </span>
    </div>
  )
}
