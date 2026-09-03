'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

type MenuItem = {
  id: string
  name: string
  price: number
  img: string
  best?: boolean
  level?: boolean
  tipe?: boolean
  flavors?: string[]
}

type CartItem = {
  id: string
  productId: string
  name: string
  price: number
  qty: number
  meta?: Record<string, string>
}

type ApiProduct = {
  id: string
  name: string
  price: number
  imageUrl?: string | null
  hasLevel: boolean
  hasType: boolean
  flavors: string[]
}

const LEVEL_OPTIONS = [
  { label: 'Level 0', value: '0' },
  { label: 'Level 1/2', value: '1/2' },
  { label: 'Level 1', value: '1' },
  { label: 'Level 2', value: '2' },
  { label: 'Level 3', value: '3' },
]

function MenuContent() {
  const router = useRouter()
  const [menuData, setMenuData] = useState<MenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const search = useSearchParams()

  // store per-item selected options
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, { level?: string; tipe?: string; flavor?: string }>
  >({})

  useEffect(() => {
    fetch('/api/products')
      .then((response) => {
        if (!response.ok) throw new Error('Menu gagal dimuat')
        return response.json()
      })
      .then((products) => {
        setMenuData(products.map((product: ApiProduct) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          img: product.imageUrl || '/window.svg',
          level: product.hasLevel,
          tipe: product.hasType,
          flavors: product.flavors || [],
        })))
      })
      .catch((error) => console.error(error))
      .finally(() => setMenuLoading(false))
  }, [])

  const setOption = (id: string, key: 'level' | 'tipe' | 'flavor', value: string) => {
    setSelectedOptions((s) => ({ ...s, [id]: { ...(s[id] || {}), [key]: value } }))
  }

  const addToCart = (item: MenuItem) => {
    const opts = selectedOptions[item.id] || {}

    const cartId = `${item.id}-${opts.level ?? 'n'}-${opts.tipe ?? 'n'}-${opts.flavor ?? 'n'}`

    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartId)
      const displayNameParts = [item.name]
      if (opts.level) displayNameParts.push(`(${opts.level})`)
      if (opts.tipe) displayNameParts.push(`[${opts.tipe}]`)
      if (opts.flavor) displayNameParts.push(`{${opts.flavor}}`)
      const displayName = displayNameParts.join(' ')

      if (existing) {
        return prev.map((c) => (c.id === cartId ? { ...c, qty: c.qty + 1 } : c))
      }

      return [
        ...prev,
        { id: cartId, productId: item.id, name: displayName, price: item.price, qty: 1, meta: { ...(opts as Record<string, string>) } },
      ]
    })
  }

  const total = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.qty, 0), [cart])
  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart])

  const checkout = async () => {
  if (cart.length === 0 || loading) return

  setLoading(true)

  try {
    const table = search?.get('table') || undefined

   const payload = {
  customerName: table ? `TABLE ${table}` : 'Walk In',
  tableNumber: table ? Number(table) : null,
  items: cart.map((item) => ({
    productId: item.productId,
    name: item.name,
    qty: item.qty,
    price: item.price,
  })),
}

    console.log('CHECKOUT PAYLOAD:', payload)

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()

      console.error('CHECKOUT API ERROR:', text)

      throw new Error(text || 'Checkout failed')
    }

    const result = await response.json()

    console.log('CHECKOUT SUCCESS:', result)

    setCart([])

    router.push(`/waiting?id=${encodeURIComponent(result.id)}`)
  } catch (error) {
    console.error('CHECKOUT ERROR:', error)

    window.alert('Checkout gagal')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-black text-white pb-40">
      <div className="px-4 md:px-8 py-8 border-b border-zinc-800">
        <h1 className="text-3xl md:text-6xl font-black">Modern Ordering</h1>
        <p className="text-zinc-400 mt-2">Premium Restaurant Experience</p>
      </div>

      <div className="p-4 md:p-8">
        {menuLoading ? <p className="text-zinc-400">Memuat menu...</p> : null}
        {!menuLoading && menuData.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 p-8 text-center text-zinc-400">
            Menu belum tersedia.
          </p>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {menuData.map((item) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden relative">
              {item.best && (
                <div className="absolute left-3 top-3 bg-orange-500 text-black px-3 py-1 rounded-full font-black text-xs">BEST</div>
              )}

              <div className="relative h-60 w-full">
                <Image src={item.img} alt={item.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">{item.name}</h2>
                    <p className="text-orange-400 mt-2 text-lg font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => addToCart(item)} className="bg-orange-500 hover:bg-orange-600 active:scale-95 transition px-5 py-3 rounded-2xl font-black">
                      Add
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {item.level && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-zinc-400 w-20">Level</label>
                      <select className="bg-zinc-800 px-3 py-2 rounded-lg" value={selectedOptions[item.id]?.level ?? ''} onChange={(e) => setOption(item.id, 'level', e.target.value)}>
                        <option value="">Select level</option>
                        {LEVEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {item.tipe && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-zinc-400 w-20">Tipe</label>
                      <select className="bg-zinc-800 px-3 py-2 rounded-lg" value={selectedOptions[item.id]?.tipe ?? ''} onChange={(e) => setOption(item.id, 'tipe', e.target.value)}>
                        <option value="">Select</option>
                        <option value="Kuah">Kuah</option>
                        <option value="Kering">Kering</option>
                      </select>
                    </div>
                  )}

                  {Boolean(item.flavors?.length) && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-zinc-400 w-20">Rasa</label>
                      <select className="bg-zinc-800 px-3 py-2 rounded-lg" value={selectedOptions[item.id]?.flavor ?? ''} onChange={(e) => setOption(item.id, 'flavor', e.target.value)}>
                        <option value="">Pilih rasa</option>
                        {item.flavors?.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-zinc-400">Total</p>
            <h2 className="text-3xl md:text-5xl font-black">Rp {total.toLocaleString('id-ID')}</h2>
          </div>

          <div className="text-orange-400 font-black text-xl">{totalItems} Items</div>

          <button disabled={cart.length === 0 || loading} onClick={checkout} className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed px-10 py-4 rounded-2xl text-xl font-black">
            {loading ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl">
          Loading menu...
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  )
}
