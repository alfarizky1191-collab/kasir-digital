'use client'

import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type MenuItem = {
  id: string
  name: string
  price: number
  img: string
  best?: boolean
  level?: boolean
  tipe?: boolean
}

type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  meta?: Record<string, string>
}

const items: Omit<MenuItem, 'id'>[] = [
  {
    name: 'Batagor',
    price: 5000,
    img: 'https://i.imgur.com/JiFateR.jpeg',
    best: true,
    tipe: true,
  },

  {
    name: 'Mie Level',
    price: 8000,
    level: true,
    img: 'https://i.imgur.com/u6FXtL7.jpeg',
    best: true,
  },

  {
    name: 'Cilok',
    price: 5000,
    img: 'https://i.imgur.com/xvHP2rG.jpeg',
  },

  {
    name: 'Es Potong Milo (full)',
    price: 4000,
    img: 'https://i.imgur.com/3ilf7yY.jpeg',
  },

  {
    name: 'Es Potong Milo (half)',
    price: 2000,
    img: 'https://i.imgur.com/3ilf7yY.jpeg',
  },

  {
    name: 'Es Potong Real good (full)',
    price: 2000,
    img: 'https://i.imgur.com/3ilf7yY.jpeg',
  },

  {
    name: 'Es Potong Real good (1/2)',
    price: 1000,
    img: 'https://i.imgur.com/3ilf7yY.jpeg',
  },

  {
    name: 'Suki Bakar',
    price: 5000,
    img: 'https://i.imgur.com/LPkTB2B.jpeg',
  },

  {
    name: 'Sosis Bakar',
    price: 5000,
    img: 'https://i.imgur.com/ZxwgE0.jpeg',
  },

  {
    name: 'Jasuke',
    price: 5000,
    img: 'https://i.imgur.com/OGNZogQ.jpeg',
  },
]

const menuData: MenuItem[] = items.map((it, idx) => ({ ...it, id: String(idx + 1) }))

const LEVEL_OPTIONS = [
  { label: 'Level 0', value: '0' },
  { label: 'Level 1/2', value: '1/2' },
  { label: 'Level 1', value: '1' },
  { label: 'Level 2', value: '2' },
  { label: 'Level 3', value: '3' },
]

const REAL_GOOD_NAMES = [
  'Es Potong Real good (full)',
  'Es Potong Real good (1/2)',
]

const FLAVORS = ['coklat', 'strawberry', 'blueberry', 'guava', 'blackcurrant']

function MenuContent() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const search = useSearchParams()

  // store per-item selected options
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, { level?: string; tipe?: string; flavor?: string }>
  >({})

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
        { id: cartId, name: displayName, price: item.price, qty: 1, meta: { ...(opts as Record<string, string>) } },
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

      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Alfa',
          tableNumber: table,
          items: cart.map((item) => ({ name: item.name, qty: item.qty, price: item.price })),
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('CHECKOUT API ERROR:', text)
        throw new Error(text || 'Checkout failed')
      }

      await response.json()
      setCart([])
      window.alert('Order berhasil dibuat')
    } catch (error) {
      console.error(error)
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {menuData.map((item) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden relative">
              {item.best && (
                <div className="absolute left-3 top-3 bg-orange-500 text-black px-3 py-1 rounded-full font-black text-xs">BEST</div>
              )}

              <img src={item.img} alt={item.name} className="w-full h-60 object-cover" />

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

                  {REAL_GOOD_NAMES.includes(item.name) && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-zinc-400 w-20">Rasa</label>
                      <select className="bg-zinc-800 px-3 py-2 rounded-lg" value={selectedOptions[item.id]?.flavor ?? ''} onChange={(e) => setOption(item.id, 'flavor', e.target.value)}>
                        <option value="">Pilih rasa</option>
                        {FLAVORS.map((f) => (
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
