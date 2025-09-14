/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'
import { supabase } from '@/lib/supabaseClient'

type WishlistItem = {
  id: number | string
  productId?: number
  title?: string
  image?: string
}

type WishlistState = {
  items: WishlistItem[]
  buildHeaders?: (token?: string) => Record<string,string>
  add: (item: WishlistItem) => void
  remove: (id: number | string) => void
  update: (id: number | string, patch: Partial<WishlistItem>) => void
  setItems: (items: WishlistItem[]) => void
}

const GUEST_WISHLIST_KEY = 'vinc-wishlist-storage-guest'

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      buildHeaders: (token?: string) => {
        const headers: Record<string,string> = { 'Content-Type': 'application/json' }
        if (token) headers.Authorization = `Bearer ${token}`
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
      add: (item) => {
        try {
          // normalize productId and id to a numeric product id so keys are stable
          const pid = Number(item.productId ?? item.id)
          if (!pid || Number.isNaN(pid)) {
            console.warn('wishlist.add: invalid product id, skipping persist', item)
            // still update local store with the raw item but coerce id to string to avoid numeric dupe
            const safeItem = { ...item, id: String(item.id) }
            set((s) => ({ items: [...s.items.filter(i => String(i.id) !== String(safeItem.id)), safeItem] }))
            return
          }
          const normalized: WishlistItem = { ...item, id: pid, productId: pid }
          // replace any existing item with same numeric product id
          set((s) => ({ items: [...s.items.filter(i => Number(i.productId ?? i.id) !== pid), normalized] }))
        } catch (e) {
          // fallback to naive set
          set((s) => ({ items: [...s.items.filter(i => i.id !== item.id), item] }))
        }

        // background sync to server when authenticated or when dev-bypass enabled
  ;(async () => {
          try {
            const isAuthenticated = useAuthStore.getState().isAuthenticated
            let token = ''
            try {
              const s = await (supabase as any).auth.getSession()
              token = (s as any)?.data?.session?.access_token || ''
            } catch (e) { /* ignore */ }
            if (!token) token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''

            const isDev = Boolean(import.meta.env && (import.meta.env.DEV as boolean))
            const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
            const canUseServer = (isAuthenticated && token) || (isDev && devAuthEnabled)

            // ensure we send a numeric productId
            const pid = Number(item.productId ?? item.id)
            if (!pid || Number.isNaN(pid)) return
            const payload = JSON.stringify({ productId: pid })
            if (canUseServer) {
              try {
                const headers = (get().buildHeaders ? get().buildHeaders(token) : { 'Content-Type': 'application/json' })
                const r = await fetch('/api/wishlist', { method: 'POST', headers, body: payload })
                if (!r.ok) {
                  const text = await r.text().catch(() => '')
                  console.error('Failed to persist wishlist item', r.status, text)
                } else {
                  // clear any per-user wishlist local keys to avoid reposting stale local data
                  try {
                    for (const k of Object.keys(localStorage)) {
                      if (k.startsWith('vinc-wishlist-storage-')) try { localStorage.removeItem(k) } catch (e) { /* ignore */ }
                    }
                  } catch (e) { /* ignore */ }
                }
              } catch (err) { console.error('Error persisting wishlist item', err) }
            }
          } catch (e) { /* ignore */ }
        })()
      },
      remove: (id) => {
        // normalize id to numeric product id if possible
        const pid = Number(id)
        if (!pid || Number.isNaN(pid)) set((s) => ({ items: s.items.filter(i => String(i.id) !== String(id)) }))
        else set((s) => ({ items: s.items.filter(i => Number(i.productId ?? i.id) !== pid) }))
  ;(async () => {
          try {
            const isAuthenticated = useAuthStore.getState().isAuthenticated
            let token = ''
            try {
              const s = await (supabase as any).auth.getSession()
              token = (s as any)?.data?.session?.access_token || ''
            } catch (e) { /* ignore */ }
            if (!token) token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''

            const isDev = Boolean(import.meta.env && (import.meta.env.DEV as boolean))
            const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
            const canUseServer = (isAuthenticated && token) || (isDev && devAuthEnabled)

            if (canUseServer) {
              try {
                const headers = (get().buildHeaders ? get().buildHeaders(token) : { 'Content-Type': 'application/json' })
                const pid = Number(id)
                if (!pid || Number.isNaN(pid)) return
                const r = await fetch('/api/wishlist', { method: 'DELETE', headers, body: JSON.stringify({ productId: pid }) })
                if (r.ok) {
                  try {
                    for (const k of Object.keys(localStorage)) {
                      if (k.startsWith('vinc-wishlist-storage-')) try { localStorage.removeItem(k) } catch (e) { /* ignore */ }
                    }
                  } catch (e) { /* ignore */ }
                }
              } catch (err) { console.error('Error deleting wishlist item', err) }
            }
          } catch (e) { /* ignore */ }
        })()
      },
      update: (id, patch) => set((s) => ({ items: s.items.map(i => i.id === id ? { ...i, ...patch } : i) })),
      setItems: (items) => {
        try {
          const normalized = (items || []).map((it: any) => {
            const pid = Number(it.productId ?? it.id)
            if (pid && !Number.isNaN(pid)) return { id: pid, productId: pid, title: it.title, image: it.image }
            return { id: String(it.id), productId: it.productId, title: it.title, image: it.image }
          })
          set(() => ({ items: normalized }))
        } catch (e) { set(() => ({ items })) }
      }
    }),
    {
      name: GUEST_WISHLIST_KEY,
      partialize: (state) => ({ items: state.items })
    }
  )
)

export type { WishlistItem }
