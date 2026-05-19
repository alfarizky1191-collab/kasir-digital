'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

const API_BASE_URL = 'http://localhost:3001';

type OrderItem = {
  id: number;
  quantity: number;
  price: number | string;
  menu?: {
    name?: string;
  };
};

type Order = {
  id: number;
  status: string;
  totalPrice: number | string;
  table?: {
    tableNumber?: string;
  };
  orderItems?: OrderItem[];
};

export default function CashierPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/order`,
        {
          cache: 'no-store',
        },
      );

      if (!res.ok) {
        throw new Error(
          `Order request failed: ${res.status}`,
        );
      }

      const data = await res.json();
      const orderList: Order[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const filteredOrders = orderList.filter(
        (order) =>
          order.status !== 'paid',
      );

      setOrders(filteredOrders);
    } catch (err) {
      console.error(
        'Fetch cashier orders error:',
        err,
      );
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    const initialFetch = setTimeout(fetchOrders, 0);

    const interval = setInterval(() => {
      fetchOrders();
    }, 3000);

    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [fetchOrders]);

  async function payOrder(id: number) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/order/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            status: 'paid',
          }),
        },
      );

      if (!res.ok) {
        throw new Error(
          `Pay order failed: ${res.status}`,
        );
      }
    } catch (err) {
      console.error(
        'Pay order error:',
        err,
      );
    }

    fetchOrders();
  }

  function clearAll() {
    setOrders([]);
  }

  function printReceipt(order: Order) {
    const printContent = `
      <html>
        <head>
          <title>Receipt</title>

          <style>
            body {
              font-family: Arial;
              padding: 20px;
            }

            h1 {
              text-align: center;
            }

            .item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }

            hr {
              margin: 15px 0;
            }
          </style>
        </head>

        <body>
          <h1>NOIR POS</h1>

          <p>Order #${order.id}</p>

          <p>
            Table:
            ${order.table?.tableNumber}
          </p>

          <hr />

          ${order.orderItems
            ?.map(
              (item) => `
                <div class="item">
                  <span>
                    ${item.menu?.name}
                    x ${item.quantity}
                  </span>

                  <span>
                    Rp ${item.price}
                  </span>
                </div>
              `,
            )
            .join('')}

          <hr />

          <h2>
            Total:
            Rp ${order.totalPrice}
          </h2>

          <p>
            Thank you 🙏
          </p>
        </body>
      </html>
    `;

    const printWindow =
      window.open(
        '',
        '',
        'width=400,height=600',
      );

    if (!printWindow) {
      alert(
        'Popup diblok browser',
      );

      return;
    }

    printWindow.document.write(
      printContent,
    );

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  return (
    <div className="min-h-screen bg-[#050816] p-10 text-white">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-5xl font-black">
          Cashier Payment
        </h1>

        <button
          onClick={clearAll}
          className="rounded-2xl bg-red-500 px-6 py-4 font-bold text-white"
        >
          Clear Screen
        </button>
      </div>

      {orders.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-20 text-center">
          <h2 className="text-4xl font-black">
            🎉 Semua order selesai
          </h2>

          <p className="mt-4 text-gray-400">
            Tidak ada pembayaran aktif
          </p>
        </div>
      )}

      <div className="grid gap-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[4px] text-orange-400">
                  Order #{order.id}
                </p>

                <h2 className="text-3xl font-black">
                  {
                    order.table
                      ?.tableNumber
                  }
                </h2>
              </div>

              <div className="rounded-2xl bg-yellow-400 px-4 py-2 font-bold uppercase text-black">
                {order.status}
              </div>
            </div>

            <div className="mb-6">
              {order.orderItems?.map(
                (item) => (
                  <div
                    key={item.id}
                    className="mb-2 flex justify-between"
                  >
                    <span>
                      {
                        item.menu
                          ?.name
                      }{' '}
                      x{' '}
                      {
                        item.quantity
                      }
                    </span>

                    <span>
                      Rp{' '}
                      {
                        item.price
                      }
                    </span>
                  </div>
                ),
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-3xl font-black text-orange-400">
                Rp{' '}
                {
                  order.totalPrice
                }
              </p>

              <button
                onClick={() => {
                  payOrder(order.id);

                  printReceipt(order);
                }}
                className="rounded-2xl bg-green-500 px-6 py-4 font-bold text-black"
              >
                Mark as Paid
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
