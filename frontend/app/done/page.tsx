import Link from 'next/link'

export default function DonePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <p className="text-6xl">✓</p>
        <h1 className="mt-5 text-5xl font-black">Pesanan selesai</h1>
        <Link
          href="/menu"
          className="mt-8 inline-block rounded-2xl bg-orange-500 px-6 py-3 font-black text-black"
        >
          Kembali ke menu
        </Link>
      </div>
    </div>
  )
}
