import { create } from 'zustand'

export interface OrderItem {
  id: number
  productId?: number
  quantity?: number
  price?: number
  title?: string
}

export interface Order {
  id: number
  amountTotal?: number
  status?: string
  createdAt?: string
  items?: OrderItem[]
}

interface OrdersStore {
  orders: Order[]
  setOrders: (orders: Order[]) => void
  clear: () => void
}

export const useOrdersStore = create<OrdersStore>((set) => ({
  orders: [],
  setOrders: (orders: Order[]) => set({ orders }),
  clear: () => set({ orders: [] })
}))

// expose for dev
if (import.meta.env.DEV) {
  try { (window as any).__useOrdersStore = useOrdersStore } catch (e) { /* ignore */ }
}
