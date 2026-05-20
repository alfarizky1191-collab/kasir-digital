'use client'

import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'

const tables = Array.from({ length: 10 }, (_, i) => i + 1)

const BASE_URL = 'https://kasir-digital.vercel.app'

export default function QRPage() {
  const printAll = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-5xl font-black">
            Table QR
          </h1>

          <button
            onClick={printAll}
            className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-2xl font-black"
          >
            Print All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {tables.map((t) => {
            const qrUrl = `${BASE_URL}/menu?table=${t}`

            return (
              <div
                key={t}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center"
              >
                <div className="mb-4 text-4xl font-black">
                  Table {t}
                </div>

                <QRCodeCanvas
                  value={qrUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />

                <p className="mt-3 text-zinc-400 text-center break-all text-xs">
                  {qrUrl}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
