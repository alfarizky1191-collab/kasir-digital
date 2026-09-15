'use client'

import { FormEvent, useEffect, useState } from 'react'

import {
  apiRequest,
  formatRupiah,
} from '@/lib/client-api'
import type { Product } from '@/lib/types'

type Category = {
  id: string
  name: string
  sort_order: number
  active: boolean
}

type ProductForm = {
  id: string | null
  categoryId: string
  name: string
  price: string
  stock: string
  imageUrl: string
  trackStock: boolean
  soldOut: boolean
  active: boolean
  options: Product['options']
}

const EMPTY_FORM: ProductForm = {
  id: null,
  categoryId: '',
  name: '',
  price: '',
  stock: '0',
  imageUrl: '',
  trackStock: true,
  soldOut: false,
  active: true,
  options: [],
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [categoryPending, setCategoryPending] = useState(false)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [message, setMessage] = useState('Memuat produk...')
  const [pending, setPending] = useState(false)

  const load = () =>
    Promise.all([
      apiRequest<Product[]>('/api/products?scope=admin'),
      apiRequest<Category[]>('/api/categories?scope=admin'),
    ]).then(([productData, categoryData]) => {
      setProducts(productData)
      setCategories(categoryData)
      setMessage('')
    })

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      Promise.all([
        apiRequest<Product[]>('/api/products?scope=admin'),
        apiRequest<Category[]>('/api/categories?scope=admin'),
      ])
        .then(([productData, categoryData]) => {
          if (!active) return
          setProducts(productData)
          setCategories(categoryData)
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

  const saveCategory = async (
    category: Category | null,
    name: string,
    active: boolean,
  ) => {
    setCategoryPending(true)
    setMessage('')

    try {
      await apiRequest<Category>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          id: category?.id || null,
          name: name.trim(),
          sortOrder:
            category?.sort_order ??
            (categories.at(-1)?.sort_order || 0) + 10,
          active,
        }),
      })
      await load()
      return true
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Kategori gagal disimpan',
      )
      return false
    } finally {
      setCategoryPending(false)
    }
  }

  const addCategory = async (event: FormEvent) => {
    event.preventDefault()
    if (
      await saveCategory(null, categoryName, true)
    ) {
      setCategoryName('')
      setMessage('Kategori tersimpan.')
    }
  }

  const renameCategory = async (category: Category) => {
    const name = window.prompt('Nama kategori:', category.name)
    if (!name || name.trim() === category.name) return
    await saveCategory(category, name, category.active)
  }

  const edit = (product: Product) => {
    setForm({
      id: product.id,
      categoryId: product.category_id || '',
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.image_url || '',
      trackStock: product.track_stock,
      soldOut: product.sold_out,
      active: product.active,
      options: product.options,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setMessage('')

    try {
      await apiRequest<Product>('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          id: form.id,
          categoryId: form.categoryId || null,
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          imageUrl: form.imageUrl || null,
          trackStock: form.trackStock,
          soldOut: form.soldOut,
          active: form.active,
          options: form.options.map((option) => ({
            name: option.name.trim(),
            values: option.values
              .map((value) => value.trim())
              .filter(Boolean),
          })),
        }),
      })
      setForm(EMPTY_FORM)
      await load()
      setMessage('Produk tersimpan.')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Produk gagal disimpan',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <p className="text-sm font-black uppercase tracking-wider text-orange-400">
        Inventory
      </p>
      <h1 className="mt-2 text-5xl font-black">Produk & Stok</h1>

      <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-2xl font-black">Kategori</h2>
        <form
          onSubmit={addCategory}
          className="mt-4 flex max-w-xl gap-3"
        >
          <input
            required
            maxLength={80}
            value={categoryName}
            onChange={(event) =>
              setCategoryName(event.target.value)
            }
            placeholder="Kategori baru"
            className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black px-3 py-3"
          />
          <button
            disabled={categoryPending}
            className="rounded-xl bg-zinc-800 px-5 font-bold disabled:opacity-50"
          >
            Tambah
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2"
            >
              <span
                className={
                  category.active
                    ? 'font-bold'
                    : 'font-bold text-zinc-500 line-through'
                }
              >
                {category.name}
              </span>
              <button
                type="button"
                disabled={categoryPending}
                onClick={() => renameCategory(category)}
                className="text-xs text-orange-400 disabled:opacity-50"
              >
                Ubah
              </button>
              <button
                type="button"
                disabled={categoryPending}
                onClick={() =>
                  saveCategory(
                    category,
                    category.name,
                    !category.active,
                  )
                }
                className="text-xs text-zinc-400 disabled:opacity-50"
              >
                {category.active ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <form
        onSubmit={save}
        className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
      >
        <h2 className="text-2xl font-black">
          {form.id ? 'Edit produk' : 'Produk baru'}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span className="mb-2 block text-sm font-bold">Nama</span>
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold">
              Kategori
            </span>
            <select
              value={form.categoryId}
              onChange={(event) =>
                setForm({
                  ...form,
                  categoryId: event.target.value,
                })
              }
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3"
            >
              <option value="">Tanpa kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold">
              Harga
            </span>
            <input
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(event) =>
                setForm({ ...form, price: event.target.value })
              }
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold">Stok</span>
            <input
              required
              type="number"
              min={0}
              value={form.stock}
              onChange={(event) =>
                setForm({ ...form, stock: event.target.value })
              }
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3"
            />
          </label>
          <label className="sm:col-span-2 lg:col-span-4">
            <span className="mb-2 block text-sm font-bold">
              URL gambar
            </span>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(event) =>
                setForm({ ...form, imageUrl: event.target.value })
              }
              className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-5">
          {[
            ['trackStock', 'Gunakan stok'],
            ['soldOut', 'Sold out manual'],
            ['active', 'Tampil di menu'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(
                  form[key as keyof ProductForm],
                )}
                onChange={(event) =>
                  setForm({
                    ...form,
                    [key]: event.target.checked,
                  })
                }
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-800 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-black">Pilihan produk</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Contoh: Level — 0, 1, 2, 3
              </p>
            </div>
            <button
              type="button"
              disabled={form.options.length >= 10}
              onClick={() =>
                setForm({
                  ...form,
                  options: [
                    ...form.options,
                    { name: '', values: [''] },
                  ],
                })
              }
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              Tambah pilihan
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {form.options.map((option, index) => (
              <div
                key={index}
                className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]"
              >
                <input
                  required
                  maxLength={40}
                  value={option.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      options: form.options.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    })
                  }
                  placeholder="Nama pilihan"
                  className="rounded-xl border border-zinc-700 bg-black px-3 py-3"
                />
                <input
                  required
                  value={option.values.join(', ')}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      options: form.options.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              values: event.target.value
                                .split(',')
                                .map((value) => value.trim()),
                            }
                          : item,
                      ),
                    })
                  }
                  placeholder="Nilai dipisahkan koma"
                  className="rounded-xl border border-zinc-700 bg-black px-3 py-3"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      options: form.options.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                  className="rounded-xl bg-red-900 px-4 py-3 text-sm font-bold"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            disabled={pending}
            className="rounded-xl bg-orange-500 px-6 py-3 font-black text-black disabled:opacity-50"
          >
            Simpan
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="rounded-xl bg-zinc-800 px-6 py-3 font-bold"
            >
              Batal edit
            </button>
          )}
        </div>
      </form>

      {message && (
        <p role="status" className="my-5 text-zinc-300">
          {message}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-3xl border border-zinc-800">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-zinc-900 text-sm uppercase text-zinc-400">
            <tr>
              <th className="p-4">Produk</th>
              <th className="p-4">Harga</th>
              <th className="p-4">Stok</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-t border-zinc-800"
              >
                <td className="p-4 font-black">{product.name}</td>
                <td className="p-4">
                  {formatRupiah(product.price)}
                </td>
                <td className="p-4">{product.stock}</td>
                <td className="p-4">
                  {!product.active
                    ? 'Nonaktif'
                    : product.sold_out
                      ? 'Sold out'
                      : 'Tersedia'}
                </td>
                <td className="p-4">
                  <button
                    type="button"
                    onClick={() => edit(product)}
                    className="rounded-xl bg-zinc-800 px-4 py-2 font-bold"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
