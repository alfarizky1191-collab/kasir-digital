 'use client'

 import { useEffect, useRef, useState } from 'react'
 import { socket } from '../lib/socket'
 import { Speaker, VolumeX } from 'lucide-react'

 type OrderItem = {
   name: string
   qty: number
   price: number
 }

 type Order = {
   id: string
   customerName: string
   tableNumber?: string | null
   status: 'pending' | 'cooking' | 'ready'
   total?: number
   items: OrderItem[]
   notes?: string | null
   createdAt?: string
 }

 export default function KitchenPage() {
   const [orders, setOrders] = useState<Order[]>([])
   const [loading, setLoading] = useState(true)

   const knownIds = useRef<Set<string>>(new Set())
   const audioRef = useRef<HTMLAudioElement | null>(null)
   const [soundOn, setSoundOn] = useState<boolean>(() => {
     try {
       const v = localStorage.getItem('kitchen.sound')
       return v === null ? true : v === '1'
     } catch (err) {
       return true
     }
   })

   const [tick, setTick] = useState(0)

   useEffect(() => {
     const t = setInterval(() => setTick((s) => s + 1), 1000)
     return () => clearInterval(t)
   }, [])

  // client-side map to record when an order became READY (completed timestamp)
  const readyAtRef = useRef<Record<string, number>>({})

   const fetchOrders = async () => {
     try {
       const res = await fetch('http://localhost:3001/api/orders/kitchen')
       if (!res.ok) {
         setOrders([])
         return
       }

       const data = await res.json()
       if (!Array.isArray(data)) {
         setOrders([])
         return
       }

       // detect newly added orders by id
       const incomingIds = new Set<string>(data.map((o: Order) => o.id))
       let isNew = false
       for (const id of incomingIds) {
         if (!knownIds.current.has(id)) {
           isNew = true
           break
         }
       }

      // update known ids
      knownIds.current = incomingIds

      // persist a client-side "ready at" timestamp for completed orders
      data.forEach((o: Order) => {
        if (o.status === 'ready' && !readyAtRef.current[o.id]) {
          readyAtRef.current[o.id] = Date.now()
        }
      })

      setOrders(data)

       // play sound only when there is at least one new order (not on initial load)
       if (isNew && audioRef && soundOn) {
         try {
           if (!audioRef.current) {
             audioRef.current = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg')
             audioRef.current.volume = 1
           }

           const play = audioRef.current.play()
           if (play && typeof (play as any).catch === 'function') (play as any).catch(() => {})
         } catch (err) {
           // ignore
         }
       }
     } catch (err) {
       console.error(err)
       setOrders([])
     } finally {
       setLoading(false)
     }
   }

   useEffect(() => {
     fetchOrders()

     // use existing shared socket instance
     const onOrdersUpdated = () => {
       fetchOrders()
     }

     socket.on('ordersUpdated', onOrdersUpdated)

     return () => {
       socket.off('ordersUpdated', onOrdersUpdated)
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [])

   useEffect(() => {
     try {
       localStorage.setItem('kitchen.sound', soundOn ? '1' : '0')
     } catch (err) {}
   }, [soundOn])

   const updateStatus = async (id: string, status: 'cooking' | 'ready') => {
     try {
       await fetch(`http://localhost:3001/api/orders/${id}/status`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status }),
       })

       // optimistically update local state — move order to new status
       setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
      // if moved to ready, record ready timestamp client-side
      if (status === 'ready') {
        readyAtRef.current[id] = Date.now()
      }
     } catch (err) {
       console.error(err)
     }
   }

  // remove an order after it has been served/cleared
  const clearOrder = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id))
        delete readyAtRef.current[id]
      } else {
        console.error('Failed to clear order', await res.text())
      }
    } catch (err) {
      console.error(err)
    }
  }

   const formatElapsed = (createdAt?: string) => {
     if (!createdAt) return '00:00:00'
     const start = new Date(createdAt).getTime()
     if (!start) return '00:00:00'
     const diff = Math.max(0, Date.now() - start)
     const sec = Math.floor(diff / 1000)
     const hh = Math.floor(sec / 3600)
     const mm = Math.floor((sec % 3600) / 60)
     const ss = sec % 60
     return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
   }

   const getStatusColor = (status: string, createdAt?: string) => {
     const moreThan15 = createdAt ? Date.now() - new Date(createdAt).getTime() > 15 * 60 * 1000 : false

     if (moreThan15) return 'ring-2 ring-red-600'

     switch (status) {
       case 'pending':
         return 'bg-yellow-600/10 border-yellow-600/30 text-yellow-300'
       case 'cooking':
         return 'bg-blue-600/10 border-blue-600/30 text-blue-300'
       case 'ready':
         return 'bg-green-600/10 border-green-600/30 text-green-300'
       default:
         return 'bg-zinc-800 text-zinc-300'
     }
   }

   if (loading) {
     return (
       <div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl">
         Loading kitchen...
       </div>
     )
   }

   const waiting = orders.filter((o) => o.status === 'pending')
   const cooking = orders.filter((o) => o.status === 'cooking')
   const done = orders.filter((o) => o.status === 'ready')

   const renderCard = (order: Order) => {
     const totalItems = order.items.reduce((a, b) => a + (b.qty || 0), 0)

    return (
      <div
        key={order.id}
        className={`flex flex-col justify-between rounded-2xl border p-4 shadow-lg min-h-[160px] transition-transform ${getStatusColor(
          order.status,
          order.createdAt,
        )} ${order.status === 'ready' ? 'transform-gpu hover:scale-[1.01]' : ''}`}
      >
         <div>
           <div className="flex items-center justify-between gap-2 mb-3">
             <div>
               <div className="text-xs text-zinc-400">{order.tableNumber ? `TABLE ${order.tableNumber}` : order.customerName}</div>
               <div className="text-xl md:text-2xl font-black">{order.id}</div>
             </div>

             <div className="text-right">
                 <div className="text-xs text-zinc-400">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}</div>
                <div className={`font-mono text-sm md:text-base ${order.createdAt && Date.now() - new Date(order.createdAt).getTime() > 15 * 60 * 1000 ? 'text-red-400' : 'text-white'}`}>
                  {formatElapsed(order.createdAt)}
                </div>
                {order.status === 'ready' && readyAtRef.current[order.id] && (
                  <div className="text-xs text-green-200 mt-1">Completed: {new Date(readyAtRef.current[order.id]).toLocaleTimeString()}</div>
                )}
             </div>
           </div>

           <div className="space-y-2 mb-3">
             {order.items.map((it, idx) => (
               <div key={idx} className="flex justify-between items-center">
                 <div className="font-bold text-lg">{it.name}</div>
                 <div className="text-xl font-black text-orange-400">x{it.qty}</div>
               </div>
             ))}
           </div>
         </div>

         <div className="mt-4 flex items-center justify-between gap-3">
           <div className="text-sm text-zinc-400">{totalItems} items</div>

           <div className="flex gap-3 w-full">
             {order.status === 'pending' && (
               <button
                 onClick={() => updateStatus(order.id, 'cooking')}
                 className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 transition py-3 rounded-2xl text-lg font-black"
               >
                 START COOKING
               </button>
             )}

             {order.status === 'cooking' && (
               <button
                 onClick={() => updateStatus(order.id, 'ready')}
                 className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 transition py-3 rounded-2xl text-lg font-black"
               >
                 MARK DONE
               </button>
             )}

             {order.status === 'ready' && (
               <div className="flex-1 flex items-center justify-between gap-3">
                 <div className="flex-1 py-3 rounded-2xl text-center text-sm font-black text-green-900 bg-green-400/10">DONE</div>
                 <button
                   onClick={() => clearOrder(order.id)}
                   className="px-3 py-2 rounded-2xl bg-zinc-800 text-sm text-white hover:bg-zinc-700 active:scale-95"
                 >
                   CLEAR
                 </button>
               </div>
             )}
           </div>
         </div>
       </div>
     )
   }

   return (
     <div className="min-h-screen bg-black text-white p-4 md:p-8">
       <div className="fixed top-4 right-4 z-50">
         <button
           aria-label={soundOn ? 'Sound on' : 'Sound off'}
           onClick={() => setSoundOn((s) => !s)}
           className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-transform active:scale-95 ${
             soundOn ? 'bg-orange-500' : 'bg-zinc-800'
           }`}
         >
           {soundOn ? <Speaker className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
           <span className="text-sm font-bold text-white">{soundOn ? 'Sound ON' : 'Sound OFF'}</span>
         </button>
       </div>

       <div className="mb-6">
         <h1 className="text-3xl md:text-6xl font-black">Kitchen Display</h1>
         <p className="text-zinc-400 mt-2 text-sm md:text-lg">Live Restaurant Orders — KDS</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div>
           <h2 className="mb-4 text-lg font-black text-yellow-300">WAITING</h2>
           <div className="space-y-4">
             {waiting.map((o) => renderCard(o))}
           </div>
         </div>

         <div>
           <h2 className="mb-4 text-lg font-black text-blue-300">COOKING</h2>
           <div className="space-y-4">
             {cooking.map((o) => renderCard(o))}
           </div>
         </div>

         <div>
           <h2 className="mb-4 text-lg font-black text-green-300">DONE</h2>
           <div className="space-y-4">
             {done.map((o) => renderCard(o))}
           </div>
         </div>
       </div>
     </div>
   )
 }