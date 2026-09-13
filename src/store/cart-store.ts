import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  price: number
  discountPrice: number | null
  thumbnail: string | null
  slug: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => { added: boolean; message: string }
  removeItem: (productId: string) => void
  clearCart: () => void
  itemCount: () => number
  total: () => number
  hasItem: (productId: string) => boolean
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const exists = get().items.find((i) => i.productId === item.productId)
        if (exists) {
          return { added: false, message: 'This product is already in your cart.' }
        }
        set((state) => ({ items: [...state.items, item] }))
        return { added: true, message: 'Added to cart!' }
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.length,

      total: () =>
        get().items.reduce(
          (sum, item) => sum + (item.discountPrice ?? item.price),
          0
        ),

      hasItem: (productId) => get().items.some((i) => i.productId === productId),
    }),
    { name: 'wmp-cart' }
  )
)
