import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type WishlistItem = {
  id: number | string
  productId?: number
  title?: string
  image?: string
}

type WishlistState = {
  items: WishlistItem[]
  add: (item: WishlistItem) => void
  remove: (id: number | string) => void
  update: (id: number | string, patch: Partial<WishlistItem>) => void
  setItems: (items: WishlistItem[]) => void
}

export const useWishlistStore = create<WishlistState>(persist((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items.filter(i => i.id !== item.id), item] })),
  remove: (id) => set((s) => ({ items: s.items.filter(i => i.id !== id) })),
  update: (id, patch) => set((s) => ({ items: s.items.map(i => i.id === id ? { ...i, ...patch } : i) })),
  setItems: (items) => set(() => ({ items }))
}), {
  name: 'vinc-wishlist-storage'
}))

export type { WishlistItem }
