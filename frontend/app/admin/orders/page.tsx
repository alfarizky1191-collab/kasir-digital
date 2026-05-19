'use client';

import {
  useCallback,
  useEffect,
  useRef,
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
  createdAt: string;
  table?: {
    tableNumber?: string;
  };
  orderItems?: OrderItem[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState(0);
  const [soundEnabled, setSoundEnabled] =
    useState(false);

  const previousOrderCount = useRef(0);

  function enableSound() {
    const audio = new Audio(
      'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg',
    );

    audio.play();

    setSoundEnabled(true);
  }

  const playNotification = useCallback(() => {
    const audio = new Audio(
      'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg',
    );

    audio.play();
  }, []);

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

      const filteredOrders = orderList
        .filter(
          (order) =>
            order.status !== 'done',
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );

      if (
        soundEnabled &&
        filteredOrders.length >
          previousOrderCount.current
      ) {
        playNotification();
      }

      previousOrderCount.current =
        filteredOrders.length;

      setOrders(filteredOrders);
    } catch (err) {
      console.error(
        'Fetch orders error:',
        err,
      );
      setOrders([]);
    }
  }, [playNotification, soundEnabled]);

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

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setNow(Date.now());
    }, 0);

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  async function updateStatus(
    id: number,
    status: string,
  ) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/order/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      if (!res.ok) {
        throw new Error(
          `Update order failed: ${res.status}`,
        );
      }
    } catch (err) {
      console.error(
        'Update order error:',
        err,
      );
    }

    fetchOrders();
  }

  function getStatusColor(status: string) {
    if (status === 'pending') {
      return 'bg-yellow-500 text-black';
    }

    if (status === 'cooking') {
      return 'bg-blue-500 text-white';
    }

    return 'bg-gray-500';
  }

  function getElapsedMinutes(
    createdAt: string,
  ) {
    if (!now) {
      return '0m 0s';
    }

    const created =
      new Date(createdAt).getTime();

    const diff =
      Math.floor((now - created) / 1000);

    const minutes = Math.floor(diff / 60);

    const seconds = diff % 60;

    return `${minutes}m ${seconds}s`;
  }

  function getTimerColor(
    createdAt: string,
  ) {
    if (!now) {
      return 'text-green-400';
    }

    const created =
      new Date(createdAt).getTime();

    const minutes = Math.floor(
      (now - created) / 1000 / 60,
    );

    if (minutes >= 15) {
      return 'text-red-400';
    }

    if (minutes >= 10) {
      return 'text-yellow-400';
    }

    return 'text-green-400';
  }

  return (
    <div className="min-h-screen bg-[#050816] p-8 text-white">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[6px] text-orange-400">
            Kitchen Display System
          </p>

          <h1 className="text-5xl font-black">
            Active Orders
          </h1>
        </div>

        {!soundEnabled ? (
          <button
            onClick={enableSound}
            className="rounded-2xl bg-orange-500 px-6 py-4 font-bold text-black"
          >
            🔔 Enable Sound
          </button>
        ) : (
          <div className="rounded-2xl bg-green-500 px-6 py-4 font-bold text-black">
            🔊 Sound Active
          </div>
        )}
      </div>

      {orders.length === 0 && (
        <div className="rounded-[40px] border border-dashed border-white/10 bg-white/5 p-20 text-center">
          <p className="text-3xl font-black">
            🎉 All orders completed
          </p>

          <p className="mt-4 text-gray-400">
            Kitchen is clear
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-[36px] border border-orange-500/10 bg-gradient-to-b from-[#121933] to-[#0b1020] p-6 shadow-2xl shadow-orange-500/10"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[4px] text-orange-400">
                  Order #{order.id}
                </p>

                <h2 className="mt-2 text-4xl font-black">
                  Table{' '}
                  {
                    order.table
                      ?.tableNumber
                  }
                </h2>
              </div>

              <div
                className={`rounded-2xl px-4 py-2 text-sm font-bold uppercase ${getStatusColor(
                  order.status,
                )}`}
              >
                {order.status}
              </div>
            </div>

            <div className="mb-6 rounded-3xl bg-black/30 p-5">
              <p className="text-sm text-gray-400">
                Elapsed Time
              </p>

              <p
                className={`mt-2 text-3xl font-black ${getTimerColor(
                  order.createdAt,
                )}`}
              >
                {getElapsedMinutes(
                  order.createdAt,
                )}
              </p>
            </div>

            <div className="mb-6 space-y-4">
              {order.orderItems?.map(
                (item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">
                          {item.menu?.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          Qty:{' '}
                          {
                            item.quantity
                          }
                        </p>
                      </div>

                      <p className="text-2xl font-black text-orange-400">
                        Rp {item.price}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  updateStatus(
                    order.id,
                    'cooking',
                  )
                }
                className="rounded-2xl bg-blue-500 py-5 text-lg font-bold transition hover:opacity-90"
              >
                Cooking
              </button>

              <button
                onClick={() =>
                  updateStatus(
                    order.id,
                    'done',
                  )
                }
                className="rounded-2xl bg-green-500 py-5 text-lg font-bold transition hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
