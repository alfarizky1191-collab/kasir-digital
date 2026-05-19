import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import Navbar from '@/components/Navbar'
import ShiftGuard from '@/components/ShiftGuard'

export const metadata: Metadata = {
  title: 'NOIR POS',
  description:
    'Modern Restaurant POS System',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        <Navbar />

        <ShiftGuard />

        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}