/* eslint-disable @next/next/no-img-element */
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  apiRequest,
  formatRupiah,
} from '@/lib/client-api'
import type { Product } from '@/lib/types'

type CartLine = {
  key: string
  product: Product
  quantity: number
  options: Record<string, string>
}

type CreateOrderResponse = {
  id: string
  order_number: number
  public_token: string
  total: number
}

function MenuContent() {
  const search = useSearchParams()
  const router = useRouter()
  const tableCode = search.get('table')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [selections, setSelections] = useState<
    Record<string, Record<string, string>>
  >({})
  const [customerName, setCustomerName] = useState('')
  const clientTokenRef = useRef<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      apiRequest<Product[]>('/api/products')
        .then((data) => {
          if (active) setProducts(data)
        })
        .catch((error: Error) => {
          if (active) setMessage(error.message)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, line) =>
          sum + line.product.price * line.quantity,
        0,
      ),
    [cart],
  )

  const add = (product: Product) => {
    clientTokenRef.current = null
    const selected = selections[product.id] || {}
    const missing = product.options.find(
      (option) => !selected[option.name],
    )

    if (missing) {
      setMessage(`Pilih ${missing.name} untuk ${product.name}`)
      return
    }

    const key = `${product.id}:${JSON.stringify(selected)}`
    setMessage('')
    setCart((current) => {
      const existing = current.find((line) => line.key === key)
      if (existing) {
        return current.map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        )
      }

      return [
        ...current,
        {
          key,
          product,
          quantity: 1,
          options: selected,
        },
      ]
    })
  }

  const changeQuantity = (key: string, delta: number) => {
    clientTokenRef.current = null
    setCart((current) =>
      current
        .map((line) =>
          line.key === key
            ? {
                ...line,
                quantity: Math.max(0, line.quantity + delta),
              }
            : line,
        )
        .filter((line) => line.quantity > 0),
    )
  }

  const checkout = async () => {
    if (!cart.length || submitting) return

    setSubmitting(true)
    setMessage('')

    try {
      const requestToken =
        clientTokenRef.current || crypto.randomUUID()
      clientTokenRef.current = requestToken
      const result = await apiRequest<CreateOrderResponse>(
        '/api/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            customerName: customerName.trim() || 'Tamu',
            tableCode,
            clientToken: requestToken,
            items: cart.map((line) => ({
              productId: line.product.id,
              quantity: line.quantity,
              options: line.options,
            })),
          }),
        },
      )

      clientTokenRef.current = null
      router.push(
        `/waiting?id=${encodeURIComponent(result.id)}&token=${encodeURIComponent(result.public_token)}`,
      )
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Checkout gagal',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-64">
      <header className="border-b border-zinc-800 px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-widest text-orange-400">
            {tableCode ? `Meja ${tableCode}` : 'Pesanan langsung'}
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-6xl">
            Menu Aluna Eats
          </h1>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {message && (
          <p
            role="status"
            className="mb-5 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-orange-200"
          >
            {message}
          </p>
        )}
        {loading ? (
          <p className="text-zinc-400">Memuat menu...</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const unavailable =
                product.sold_out ||
                (product.track_stock && product.stock <= 0)

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="h-48 bg-zinc-900" />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black">
                          {product.name}
                        </h2>
                        <p className="mt-1 font-black text-orange-400">
                          {formatRupiah(product.price)}
                        </p>
                      </div>
                      {product.track_stock && (
                        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
                          Stok {product.stock}
                        </span>
                      )}
                    </div>

                    {product.options.map((option) => (
                      <label
                        key={option.name}
                        className="mt-4 block"
                      >
                        <span className="mb-2 block text-xs font-bold uppercase text-zinc-500">
                          {option.name}
                        </span>
                        <select
                          value={
                            selections[product.id]?.[option.name] ||
                            ''
                          }
                          onChange={(event) =>
                            setSelections((current) => ({
                              ...current,
                              [product.id]: {
                                ...current[product.id],
                                [option.name]: event.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2"
                        >
                          <option value="">Pilih</option>
                          {option.values.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}

                    <button
                      type="button"
                      disabled={unavailable}
                      onClick={() => add(product)}
                      className="mt-5 w-full rounded-2xl bg-orange-500 py-3 font-black text-black disabled:bg-zinc-800 disabled:text-zinc-500"
                    >
                      {unavailable ? 'Habis' : 'Tambah'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-800 bg-black/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-7xl">
          <input
            value={customerName}
            onChange={(event) =>
              setCustomerName(event.target.value)
            }
            maxLength={80}
            placeholder="Nama pemesan (opsional)"
            className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
          />
          <div className="max-h-24 space-y-2 overflow-y-auto">
            {cart.map((line) => (
              <div
                key={line.key}
                className="flex items-center gap-3 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">
                  {line.product.name}
                </span>
                <button
                  type="button"
                  onClick={() => changeQuantity(line.key, -1)}
                  className="h-7 w-7 rounded-full bg-zinc-800"
                >
                  −
                </button>
                <span className="w-5 text-center font-bold">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => changeQuantity(line.key, 1)}
                  className="h-7 w-7 rounded-full bg-zinc-800"
                >
                  +
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-500">Total</p>
              <p className="truncate text-2xl font-black text-orange-400">
                {formatRupiah(total)}
              </p>
            </div>
            <button
              type="button"
              disabled={!cart.length || submitting}
              onClick={checkout}
              className="rounded-2xl bg-orange-500 px-7 py-4 font-black text-black disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Pesan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-zinc-400">Memuat menu...</div>
      }
    >
      <MenuContent />
    </Suspense>
  )
}
