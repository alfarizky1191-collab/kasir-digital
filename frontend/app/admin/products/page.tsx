'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'

type Product = {
  id: string; name: string; price: number; category: string; imageUrl?: string | null
  stock?: number | null; isActive: boolean; hasLevel: boolean; hasType: boolean; flavors: string[]
}

const emptyForm = { name: '', price: '', category: 'Makanan', imageUrl: '', stock: '', hasLevel: false, hasType: false, flavors: '' }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const response = await fetch('/api/products/admin/all', { cache: 'no-store' })
    if (response.ok) setProducts(await response.json())
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  async function save(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    const response = await fetch(editingId ? `/api/products/${editingId}` : '/api/products', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        stock: form.stock === '' ? null : Number(form.stock),
        flavors: form.flavors.split(',').map((item) => item.trim()).filter(Boolean),
      }),
    })
    const result = await response.json()
    if (!response.ok) { setMessage(result.message || 'Gagal menyimpan produk'); return }
    setForm(emptyForm); setEditingId(null); setMessage('Produk berhasil disimpan'); await load()
  }

  function edit(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name, price: String(product.price), category: product.category,
      imageUrl: product.imageUrl || '', stock: product.stock == null ? '' : String(product.stock),
      hasLevel: product.hasLevel, hasType: product.hasType, flavors: product.flavors.join(', '),
    })
  }

  async function toggle(product: Product) {
    await fetch(`/api/products/${product.id}/active`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !product.isActive }),
    })
    await load()
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 text-white md:p-8">
      <h1 className="text-4xl font-black">Kelola Menu & Stok</h1>
      <p className="mt-2 text-zinc-400">Stok kosong berarti produk tidak dibatasi stok.</p>

      <form onSubmit={save} className="mt-8 grid gap-3 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:grid-cols-3">
        <input required placeholder="Nama produk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl bg-black p-3" />
        <input required type="number" min="0" placeholder="Harga" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl bg-black p-3" />
        <input placeholder="Kategori" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl bg-black p-3" />
        <input type="url" placeholder="URL gambar" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="rounded-xl bg-black p-3" />
        <input type="number" min="0" placeholder="Stok (kosong = unlimited)" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-xl bg-black p-3" />
        <input placeholder="Rasa, pisahkan koma" value={form.flavors} onChange={(e) => setForm({ ...form, flavors: e.target.value })} className="rounded-xl bg-black p-3" />
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasLevel} onChange={(e) => setForm({ ...form, hasLevel: e.target.checked })} /> Pilihan level</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasType} onChange={(e) => setForm({ ...form, hasType: e.target.checked })} /> Pilihan kuah/kering</label>
        <button className="rounded-xl bg-orange-500 p-3 font-black text-black">{editingId ? 'Simpan Perubahan' : 'Tambah Produk'}</button>
        {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }} className="rounded-xl border border-zinc-700 p-3">Batal</button> : null}
        {message ? <p role="status" className="text-sm text-orange-300">{message}</p> : null}
      </form>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-zinc-800">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-zinc-900 text-zinc-400"><tr><th className="p-4">Produk</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>{products.map((product) => <tr key={product.id} className="border-t border-zinc-800">
            <td className="p-4"><strong>{product.name}</strong><div className="text-sm text-zinc-500">{product.category}</div></td>
            <td>Rp {product.price.toLocaleString('id-ID')}</td><td>{product.stock ?? 'Unlimited'}</td><td>{product.isActive ? 'Aktif' : 'Nonaktif'}</td>
            <td className="space-x-2"><button onClick={() => edit(product)} className="rounded-lg bg-zinc-800 px-3 py-2">Edit</button><button onClick={() => toggle(product)} className="rounded-lg bg-zinc-800 px-3 py-2">{product.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </main>
  )
}
