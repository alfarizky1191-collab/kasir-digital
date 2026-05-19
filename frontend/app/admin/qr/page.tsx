'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function QRPage() {
  const tables = [
    'A1',
    'A2',
    'A3',
    'A4',
    'A5',
  ];

  return (
    <div className="min-h-screen bg-[#050816] p-10 text-white">
      <h1 className="mb-10 text-5xl font-black">
        Table QR Codes
      </h1>

      <div className="grid grid-cols-2 gap-8 md:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => (
          <div
            key={table}
            className="rounded-3xl bg-white p-6 text-center text-black"
          >
            <h2 className="mb-6 text-3xl font-black">
              {table}
            </h2>

            <div className="flex justify-center">
              <QRCodeSVG
                value={`http://192.168.1.15:3000/menu?table=${table}`}
                size={220}
              />
            </div>

            <p className="mt-6 text-sm font-semibold">
              Scan to Order
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}