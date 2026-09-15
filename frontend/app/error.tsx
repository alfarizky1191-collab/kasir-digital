'use client'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <p className="text-sm font-black uppercase tracking-wider text-red-400">
          Terjadi kesalahan
        </p>
        <h1 className="mt-3 text-4xl font-black">
          Halaman gagal dimuat
        </h1>
        <p className="mt-3 text-zinc-400">
          Coba ulangi. Jika tetap gagal, periksa koneksi dan status
          layanan.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-orange-500 px-5 py-3 font-black text-black"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
