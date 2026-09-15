import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <p className="text-sm font-black uppercase tracking-wider text-orange-400">
          404
        </p>
        <h1 className="mt-3 text-5xl font-black">
          Halaman tidak ditemukan
        </h1>
        <Link
          href="/"
          className="mt-7 inline-block rounded-xl bg-zinc-800 px-5 py-3 font-bold"
        >
          Kembali
        </Link>
      </div>
    </div>
  )
}
