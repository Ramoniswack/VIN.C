/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'
import { supabase } from '@/lib/supabaseClient'

export interface CartVariant { size?: string; color?: string; sku?: string }
export interface CartItem { id: number; name: string; price: number; image?: string; variant?: CartVariant; quantity: number }

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  // helper to build headers for server requests (may be optional)
  buildHeaders?: (token?: string) => Record<string, string>
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeFromCart: (id: number, variant?: CartVariant) => void
  updateQuantity: (id: number, variant: CartVariant | undefined, quantity: number) => void
  clearCart: () => void
  setIsOpen: (isOpen: boolean) => void
  setItems: (items: CartItem[]) => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const GUEST_CART_KEY = 'vinc-cart-storage-guest'

// Normalize variant whether it's an object or a JSON string
const normalizeVariant = (v?: any): CartVariant | undefined => {
  if (!v) return undefined
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v)
      if (p === null) return undefined
      if (typeof p === 'object') {
        if (Object.keys(p).length === 0) return undefined
        return p
      }
      return undefined
    } catch {
      return undefined
    }
  }
  if (typeof v === 'object') {
    try {
      if (Object.keys(v).length === 0) return undefined
    } catch (e) { /* ignore */ }
    return v
  }
  return undefined
}

// Create a stable key for a variant by ordering keys then JSON stringifying
const variantKey = (v?: any): string => {
  const nv = normalizeVariant(v)
  if (!nv) return ''
  const keys = Object.keys(nv).sort()
  const ordered: Record<string, any> = {}
  for (const k of keys) ordered[k] = (nv as any)[k]
  try { return JSON.stringify(ordered) } catch { return '' }
}

// Simple per-item debouncers to coalesce rapid quantity updates
const debouncers: Record<string, ReturnType<typeof setTimeout> | null> = {}
// Debouncers and pending deltas for add-to-cart actions
const addDebouncers: Record<string, ReturnType<typeof setTimeout> | null> = {}
const pendingAdds: Record<string, number> = {}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // helper to build headers for server requests (supports dev bypass)
      // include Authorization when token is present; in dev with VITE_DEV_AUTH_ENABLED='true'
      // also include X-ADMIN and X-USER-EMAIL so local dev requests are authorized by the server.
      // This mirrors the logic used in Dashboard.buildHeaders.
  buildHeaders: (_token?: string) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (_token) headers.Authorization = `Bearer ${_token}`
        try {
          const isDev = Boolean(import.meta.env && (import.meta.env.DEV as boolean))
          const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
          if (isDev && devAuthEnabled) {
            headers['X-ADMIN'] = '1'
            const u = useAuthStore.getState().user
            if (u && (u as any).username) headers['X-USER-EMAIL'] = String((u as any).username).trim().toLowerCase()
            else headers['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
          }
        } catch (e) { /* ignore */ }
        return headers
      },

      addToCart: (item) => {
        try {
          const ik = variantKey(item.variant)
          const qtyToAdd = item.quantity ?? 1

          // Local optimistic update immediately
          const existing = get().items.find(i => i.id === item.id && variantKey(i.variant) === ik)
          if (existing) {
            set({ items: get().items.map(i => (i.id === item.id && variantKey(i.variant) === ik ? { ...i, quantity: i.quantity + qtyToAdd } : i)) })
          } else {
            set({ items: [...get().items, { ...item, variant: normalizeVariant(item.variant), quantity: qtyToAdd }] })
          }

          // accumulate pending delta
          const sendKey = `${item.id}-${ik || '_'}-add`
          pendingAdds[sendKey] = (pendingAdds[sendKey] || 0) + qtyToAdd

          // debounce the actual server sync so rapid clicks coalesce to a single POST
          if (addDebouncers[sendKey]) clearTimeout(addDebouncers[sendKey] as ReturnType<typeof setTimeout>)
          addDebouncers[sendKey] = setTimeout(async () => {
            addDebouncers[sendKey] = null
            const delta = pendingAdds[sendKey] || 0
            delete pendingAdds[sendKey]
            if (delta <= 0) return

            try {
              const isAuthenticated = useAuthStore.getState().isAuthenticated
              let token = ''
              try { const s = await (supabase as any).auth.getSession(); token = (s?.data?.session as any)?.access_token || '' } catch (e) { /* ignore */ }
              if (!token) token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''

              const isDev = Boolean(import.meta.env && (import.meta.env.DEV as boolean))
              const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
              const canUseServer = (isAuthenticated && token) || (isDev && devAuthEnabled)

              if (!canUseServer) return

              // Use inflight marker to avoid duplicate concurrent sends for same item
              const inflight: Set<string> = (window as any).__vinc_inflight_cart_posts || new Set()
              ;(window as any).__vinc_inflight_cart_posts = inflight
              const inflightKey = `${item.id}-${ik || '_'}-send`
              if (inflight.has(inflightKey)) return
              inflight.add(inflightKey)
              try {
                const body: any = { productId: item.id, quantity: delta }
                if (ik) body.variant = ik
                const headers = (get() as any).buildHeaders(token)
                const resp = await fetch('/api/cart', { method: 'POST', headers, body: JSON.stringify(body) })
                if (resp.ok) {
                  // refresh authoritative cart
                  try {
                    const headers2 = (get() as any).buildHeaders(token)
                    const rr = await fetch('/api/cart', { headers: headers2 })
                    if (rr.ok) {
                      const j = await rr.json()
                      const items = Array.isArray(j.items) ? j.items : []
                      const mapped = items.map((c: any) => ({
                        id: Number((c.product && c.product.id) || c.productId || c.id),
                        name: (c.product && (c.product.title || '')) || '',
                        price: Number(((c.product && c.product.price) || 0) as number) / 100,
                        image: (c.product && Array.isArray(c.product.images) ? c.product.images[0] : '') || '',
                        variant: normalizeVariant(typeof c.variant === 'string' ? (() => { try { return JSON.parse(c.variant) } catch { return undefined } })() : c.variant),
                        quantity: Number(c.quantity || 1)
                      }))
                      set({ items: mapped })
                    }
                  } catch (e) { /* ignore */ }
                }
              } catch (e) {
                console.error('Error persisting cart item', e)
              } finally {
                inflight.delete(inflightKey)
              }
            } catch (e) { /* ignore */ }
          }, 250)
        } catch (e) {
          // swallow errors
        }
      },

  removeFromCart: (id, variant) => {
        const vk = variantKey(variant)
        // Cancel any pending debounced sync for this item so it doesn't re-add after removal
        try {
          const syncKey = `${id}-${vk || '_'}-qty`
          if (debouncers[syncKey]) {
            clearTimeout(debouncers[syncKey] as ReturnType<typeof setTimeout>)
            debouncers[syncKey] = null
          }
        } catch (e) { /* ignore */ }

        // Also cancel any pending "add" debouncer and clear pending add delta so
        // a previously-scheduled add won't re-create the item after we delete it.
        try {
          const sendKey = `${id}-${vk || '_'}-add`
          if (addDebouncers[sendKey]) {
            clearTimeout(addDebouncers[sendKey] as ReturnType<typeof setTimeout>)
            addDebouncers[sendKey] = null
          }
          if (Object.prototype.hasOwnProperty.call(pendingAdds, sendKey)) {
            delete pendingAdds[sendKey]
          }
        } catch (e) { /* ignore */ }

        // Update local first
        set({ items: get().items.filter(item => !(item.id === id && variantKey(item.variant) === vk)) })
        // notify other parts of the app (dashboard/listeners) that cart changed
        try { window.dispatchEvent(new CustomEvent('vinc:data-changed')) } catch (e) { /* ignore */ }

        ;(async () => {
          try {
            const isAuthenticated = useAuthStore.getState().isAuthenticated
            let token = ''
            try { const s = await (supabase as any).auth.getSession(); token = (s?.data?.session as any)?.access_token || '' } catch (e) { /* ignore */ }
            if (!token) token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''

            const body: any = { productId: id }
            if (vk) body.variant = vk

            const isDev = Boolean(import.meta.env && (import.meta.env.DEV as boolean))
            const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
            const canUseServer = (isAuthenticated && token) || (isDev && devAuthEnabled)

            if (canUseServer) {
              // Also clear any inflight add requests for this item to avoid races
              try {
                const inflight: Set<string> = (window as any).__vinc_inflight_cart_posts || new Set()
                ;(window as any).__vinc_inflight_cart_posts = inflight
                // remove any keys that start with the product id and variant
                for (const k of Array.from(inflight)) {
                  if (k.startsWith(String(id) + '-' + (vk || '_'))) inflight.delete(k)
                }
              } catch (e) { /* ignore */ }

              const headers = (get() as any).buildHeaders(token)
              await fetch('/api/cart', { method: 'DELETE', headers, body: JSON.stringify(body) })

              // Re-fetch authoritative cart
              try {
                const headers2 = (get() as any).buildHeaders(token)
                const rr = await fetch('/api/cart', { headers: headers2 })
                if (rr.ok) {
                  const j = await rr.json()
                  const items = Array.isArray(j.items) ? j.items : []
                  const mapped = items.map((c: any) => ({
                    id: Number((c.product && c.product.id) || c.productId || c.id),
                    name: (c.product && (c.product.title || '')) || '',
                    price: Number(((c.product && c.product.price) || 0) as number) / 100,
                    image: (c.product && Array.isArray(c.product.images) ? c.product.images[0] : '') || '',
                    variant: normalizeVariant(typeof c.variant === 'string' ? (() => { try { return JSON.parse(c.variant) } catch { return undefined } })() : c.variant),
                    quantity: Number(c.quantity || 1)
                  }))
                  set({ items: mapped })

                  // If the server still reports the removed item, attempt a fallback deletion by productId only
                  try {
                    const vkCheck = vk || ''
                    const stillThere = mapped.find((it: any) => Number(it.id) === Number(id) && variantKey(it.variant) === vkCheck)
                    if (stillThere) {
                      // perform fallback delete without variant to remove any duplicated rows
                      try {
                        await fetch('/api/cart', { method: 'DELETE', headers: headers2, body: JSON.stringify({ productId: id }) })
                        // re-fetch once more to sync
                        const rr2 = await fetch('/api/cart', { headers: headers2 })
                        if (rr2.ok) {
                          const j2 = await rr2.json()
                          const items2 = Array.isArray(j2.items) ? j2.items : []
                          const mapped2 = items2.map((c: any) => ({
                            id: Number((c.product && c.product.id) || c.productId || c.id),
                            name: (c.product && (c.product.title || '')) || '',
                            price: Number(((c.product && c.product.price) || 0) as number) / 100,
                            image: (c.product && Array.isArray(c.product.images) ? c.product.images[0] : '') || '',
                            variant: normalizeVariant(typeof c.variant === 'string' ? (() => { try { return JSON.parse(c.variant) } catch { return undefined } })() : c.variant),
                            quantity: Number(c.quantity || 1)
                          }))
                          set({ items: mapped2 })
                        }
                      } catch (e) { /* ignore fallback delete errors */ }
                    }
                  } catch (e) { /* ignore */ }
                }
              } catch (e) {
                // ignore
              }
            }
          } catch (e) {
            // ignore
          }
        })()
      },

      updateQuantity: (id, variant, quantity) => {
        const vk = variantKey(variant)
        // Capture previous quantity before optimistic update
        const prev = get().items.find(item => item.id === id && variantKey(item.variant) === vk)
        const prevQty = prev ? Number(prev.quantity || 0) : 0

        // Local optimistic update
        set({ items: get().items.map(item => (item.id === id && variantKey(item.variant) === vk ? { ...item, quantity } : item)) })

        const syncKey = `${id}-${vk || '_'}-qty`
        // Debounce per item/variant
        if (debouncers[syncKey]) {
          clearTimeout(debouncers[syncKey] as ReturnType<typeof setTimeout>)
        }

        debouncers[syncKey] = setTimeout(async () => {
          debouncers[syncKey] = null
          // If quantity is zero or less, remove the item
          if (quantity <= 0) { get().removeFromCart(id, variant); return }

          try {
            // Compute delta to send to server because POST /api/cart is additive on the server
            const delta = Number(quantity) - Number(prevQty)
            // nothing to do
            if (!delta || Number.isNaN(Number(delta))) return

            const isAuthenticated = useAuthStore.getState().isAuthenticated
            let token = ''
            try { const s = await (supabase as any).auth.getSession(); token = (s?.data?.session as any)?.access_token || '' } catch (e) { /* ignore */ }
            if (!token) token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''

            const body: any = { productId: id, quantity: delta }
            if (vk) body.variant = vk

            const isDev = Boolean(import.meta.env && (import.meta.env.DEV as boolean))
            const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
            const canUseServer = (isAuthenticated && token) || (isDev && devAuthEnabled)

            if (canUseServer) {
              const headers = (get() as any).buildHeaders(token)
              await fetch('/api/cart', { method: 'POST', headers, body: JSON.stringify(body) })

              // Re-fetch authoritative cart
              try {
                const headers2 = (get() as any).buildHeaders(token)
                const rr = await fetch('/api/cart', { headers: headers2 })
                if (rr.ok) {
                  const j = await rr.json()
                  const items = Array.isArray(j.items) ? j.items : []
                  const mapped = items.map((c: any) => ({
                    id: Number((c.product && c.product.id) || c.productId || c.id),
                    name: (c.product && (c.product.title || '')) || '',
                    price: Number(((c.product && c.product.price) || 0) as number) / 100,
                    image: (c.product && Array.isArray(c.product.images) ? c.product.images[0] : '') || '',
                    variant: normalizeVariant(typeof c.variant === 'string' ? (() => { try { return JSON.parse(c.variant) } catch { return undefined } })() : c.variant),
                    quantity: Number(c.quantity || 1)
                  }))
                  set({ items: mapped })
                }
              } catch (e) {
                // ignore
              }
            }
          } catch (e) {
            // ignore
          }
        }, 300)
      },

  clearCart: () => set({ items: [] }),

  setIsOpen: (isOpen) => set({ isOpen }),

  getTotalItems: () => get().items.reduce((total, item) => total + (Number(item.quantity) || 0), 0),

  getTotalPrice: () => get().items.reduce((total, item) => total + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0),

  setItems: (items) => {
        try {
          const normalized = (items || []).map(it => ({ ...it, variant: normalizeVariant((it as any).variant) }))
          set({ items: normalized })
        } catch {
          set({ items })
        }
      }
    }),
    {
      name: GUEST_CART_KEY,
      partialize: (state) => ({ items: state.items })
    }
  )
)

export default useCartStore