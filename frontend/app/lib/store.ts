import { create } from 'zustand'

export type CartItem = {
  id: number
  name: string
  price: number
  qty: number
}

type Store = {
  cart: CartItem[]
  addItem: (item: CartItem) => void
  increase: (id: number) => void
  decrease: (id: number) => void
  clearCart: () => void
}

export const useCart = create<Store>((set) => ({
  cart: [],

  addItem: (item) =>
    set((state) => {
      const exist = state.cart.find((x) => x.id === item.id)

      if (exist) {
        return {
          cart: state.cart.map((x) =>
            x.id === item.id
              ? { ...x, qty: x.qty + 1 }
              : x
          ),
        }
      }

      return {
        cart: [...state.cart, { ...item, qty: 1 }],
      }
    }),

  increase: (id) =>
    set((state) => ({
      cart: state.cart.map((x) =>
        x.id === id
          ? { ...x, qty: x.qty + 1 }
          : x
      ),
    })),

  decrease: (id) =>
    set((state) => ({
      cart: state.cart
        .map((x) =>
          x.id === id
            ? { ...x, qty: x.qty - 1 }
            : x
        )
        .filter((x) => x.qty > 0),
    })),

  clearCart: () => set({ cart: [] }),
}))