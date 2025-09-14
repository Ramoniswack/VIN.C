import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabaseClient'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useCartStore } from './cartStore'
import { useWishlistStore } from './wishlistStore'
import { useOrdersStore } from './ordersStore'

interface User {
  username: string
  isAdmin: boolean
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  signInWithSupabase: (email: string, password: string, remember?: boolean) => Promise<boolean>
  signUpWithSupabase: (email: string, password: string, remember?: boolean) => Promise<boolean>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async () => false,

      signInWithSupabase: async (email: string, password: string, remember = false) => {
        try {
          const client = supabase as unknown as SupabaseClient
          const { data, error } = await client.auth.signInWithPassword({ email, password })
          if (error) return false

          if (!data?.session || !data.user) return false

          // set session client-side
          try { await client.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token ?? '' }) } catch (e) { /* ignore */ }

          set({ user: { username: data.user.email || '', isAdmin: false }, isAuthenticated: true })
          try { localStorage.setItem('vinc-auth-storage', JSON.stringify({ state: { user: { username: data.user.email || '', isAdmin: false }, isAuthenticated: true } })) } catch (e) { /* ignore */ }

          // persist tokens
          try {
            if (remember) {
              localStorage.setItem('supabase_access_token', data.session.access_token)
              if (data.session.refresh_token) localStorage.setItem('supabase_refresh_token', data.session.refresh_token)
              localStorage.setItem('authToken', data.session.access_token)
            } else {
              sessionStorage.setItem('supabase_access_token', data.session.access_token)
              if (data.session.refresh_token) sessionStorage.setItem('supabase_refresh_token', data.session.refresh_token)
              sessionStorage.setItem('authToken', data.session.access_token)
            }
          } catch (e) { /* ignore */ }

          // merge guest data into server and hydrate client stores
          try {
            const token = remember ? localStorage.getItem('supabase_access_token') ?? '' : sessionStorage.getItem('supabase_access_token') ?? ''
            const guestCartKey = 'vinc-cart-storage-guest'
            const guestWishlistKey = 'vinc-wishlist-storage-guest'
            const guestRaw = localStorage.getItem(guestCartKey)
            const guestItems = guestRaw ? (JSON.parse(guestRaw).state?.items ?? JSON.parse(guestRaw).items ?? []) : []
            const guestWishlistRaw = localStorage.getItem(guestWishlistKey)
            const guestWishlist = guestWishlistRaw ? (JSON.parse(guestWishlistRaw).state?.items ?? JSON.parse(guestWishlistRaw).items ?? []) : []

            if (token) {
              // post cart items
              if (Array.isArray(guestItems) && guestItems.length) {
                for (const it of guestItems) {
                  try {
                    const body: any = { productId: it.id, quantity: it.quantity || 1 }
                    if (it.variant) body.variant = typeof it.variant === 'string' ? it.variant : JSON.stringify(it.variant)
                    await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
                  } catch (e) { /* ignore */ }
                }
                try { localStorage.removeItem(guestCartKey) } catch (e) { /* ignore */ }
              }

              // post wishlist items
              if (Array.isArray(guestWishlist) && guestWishlist.length) {
                for (const it of guestWishlist) {
                  try {
                    await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: it.productId || it.id }) })
                  } catch (e) { /* ignore */ }
                }
                try { localStorage.removeItem(guestWishlistKey) } catch (e) { /* ignore */ }
              }

              // hydrate from server
              try {
                const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                const respC = await fetch('/api/cart', { headers })
                const jc = await respC.json().catch(() => ({ items: [] }))
                const serverCart = jc.items || []
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedCart = (serverCart as any[]).map((c: any) => ({ id: Number((c.product && c.product.id) || c.productId || c.id), name: (c.product && (c.product.title || '')) || '', price: Number(((c.product && c.product.price) || 0) as number) / 100, image: (c.product && Array.isArray(c.product.images) ? c.product.images[0] : '') || '', variant: c.variant ? (typeof c.variant === 'string' ? (() => { try { return JSON.parse(c.variant) } catch { return undefined } })() : c.variant) : undefined, quantity: Number(c.quantity || 1) }))
                try { useCartStore.getState().setItems(mappedCart) } catch (e) { /* ignore */ }

                const respW = await fetch('/api/wishlist', { headers })
                const jw = await respW.json().catch(() => ({ items: [] }))
                const serverWishlist = jw.items || []
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedWishlist = (serverWishlist as any[]).map((it: any) => ({ id: Number((it.product && it.product.id) || it.productId || it.id), productId: Number((it.product && it.product.id) || it.productId || it.id), title: (it.product && (it.product.title || '')) || '', image: (it.product && Array.isArray(it.product.images) ? it.product.images[0] : '') || '' }))
                try { useWishlistStore.getState().setItems(mappedWishlist) } catch (e) { /* ignore */ }

                try { localStorage.removeItem('vinc-cart-storage-guest') } catch (e) { /* ignore */ }
                try { localStorage.removeItem('vinc-wishlist-storage-guest') } catch (e) { /* ignore */ }

                // Clear any per-user localStorage cart/wishlist keys to avoid re-posting old local data
                try {
                  for (const k of Object.keys(localStorage)) {
                    if (k.startsWith('vinc-cart-storage-') || k.startsWith('vinc-wishlist-storage-')) {
                      try { localStorage.removeItem(k) } catch (e) { /* ignore */ }
                    }
                  }
                } catch (e) { /* ignore */ }

                // hydrate orders for the signed-in user
                  try {
                    const respO = await fetch('/api/users/me/orders', { headers })
                    const jo = await respO.json().catch(() => ({ orders: [] }))
                    const serverOrders = jo.orders || []
                    try { useOrdersStore.getState().setOrders(serverOrders) } catch (e) { /* ignore */ }
                  } catch (e) { /* ignore */ }
              } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }

          try { window.dispatchEvent(new CustomEvent('vinc:data-changed')) } catch (e) { /* ignore */ }

          return true
        } catch (e) {
          return false
        }
      },

      signUpWithSupabase: async (email: string, password: string, remember = false) => {
        try {
          const client = supabase as unknown as SupabaseClient
          const { data, error } = await client.auth.signUp({ email, password })
          if (error) return false

          if (data?.session && data.user) {
            set({ user: { username: data.user.email || '', isAdmin: false }, isAuthenticated: true })
            try { localStorage.setItem('vinc-auth-storage', JSON.stringify({ state: { user: { username: data.user.email || '', isAdmin: false }, isAuthenticated: true } })) } catch (e) { /* ignore */ }
            try {
              if (remember) {
                localStorage.setItem('supabase_access_token', data.session.access_token)
                if (data.session.refresh_token) localStorage.setItem('supabase_refresh_token', data.session.refresh_token)
                localStorage.setItem('authToken', data.session.access_token)
              } else {
                sessionStorage.setItem('supabase_access_token', data.session.access_token)
                if (data.session.refresh_token) sessionStorage.setItem('supabase_refresh_token', data.session.refresh_token)
                sessionStorage.setItem('authToken', data.session.access_token)
              }
            } catch (e) { /* ignore */ }
          }
          return !!data.user
        } catch (e) {
          return false
        }
      },

      logout: async () => {
        try {
          const client = supabase as unknown as SupabaseClient
          await client.auth.signOut()
        } catch (e) { /* ignore */ }
        try { localStorage.removeItem('supabase_access_token') } catch (e) { /* ignore */ }
        try { localStorage.removeItem('supabase_refresh_token') } catch (e) { /* ignore */ }
        try { sessionStorage.removeItem('supabase_access_token') } catch (e) { /* ignore */ }
        try { sessionStorage.removeItem('supabase_refresh_token') } catch (e) { /* ignore */ }
        try { localStorage.removeItem('authToken') } catch (e) { /* ignore */ }
        try { sessionStorage.removeItem('authToken') } catch (e) { /* ignore */ }
        try { localStorage.removeItem('vinc-auth-storage') } catch (e) { /* ignore */ }
        set({ user: null, isAuthenticated: false })
        try { window.dispatchEvent(new CustomEvent('vinc:data-changed')) } catch (e) { /* ignore */ }
      }
    }),
    {
      name: 'vinc-auth-storage'
    }
  )
)

// expose for dev
if (import.meta.env.DEV) {
  try { (window as any).__useAuthStore = useAuthStore } catch (e) { /* ignore */ }
}

