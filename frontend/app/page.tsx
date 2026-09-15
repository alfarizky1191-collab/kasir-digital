import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-5xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-orange-400">
          Aluna Eats
        </p>
        <h1 className="max-w-3xl text-5xl font-black leading-none sm:text-7xl">
          Pesan, masak, bayar—semua tercatat.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Pelanggan dapat memesan dari meja. Tim dapur dan kasir
          menerima antrean yang sama dengan stok serta laporan shift
          yang terlindungi.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/menu"
            className="rounded-3xl bg-orange-500 p-7 text-black transition hover:bg-orange-400"
          >
            <span className="block text-sm font-bold uppercase tracking-wider">
              Pelanggan
            </span>
            <span className="mt-2 block text-3xl font-black">
              Buka Menu
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded-3xl border border-zinc-700 bg-zinc-900 p-7 transition hover:border-zinc-500"
          >
            <span className="block text-sm font-bold uppercase tracking-wider text-zinc-400">
              Pemilik & staf
            </span>
            <span className="mt-2 block text-3xl font-black">
              Masuk ke POS
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
