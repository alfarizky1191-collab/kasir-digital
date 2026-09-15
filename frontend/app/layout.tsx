import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: {
    default: 'Kasir Digital',
    template: '%s | Kasir Digital',
  },
  description:
    'Sistem pemesanan, dapur, kasir, stok, dan laporan untuk Aluna Eats.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-black text-white antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}
