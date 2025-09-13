import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js'
import { useCartStore } from './cartStore'
import { useWishlistStore } from './wishlistStore'

interface User {
  username: string;
  isAdmin: boolean;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signInWithSupabase: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  signUpWithSupabase: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => void;
}

// This is a simplified auth implementation - in a real app, you would use proper authentication
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      login: async (username: string, password: string) => {
        // Legacy demo removed. Real admin sign-in should occur via Supabase OAuth or email flows.
        return false;
      },

      signInWithSupabase: async (email: string, password: string, remember = false) => {
        try {
          const client = supabase as unknown as SupabaseClient
          const { data, error } = await client.auth.signInWithPassword({ email, password })
          if (error) return false

          // If supabase returns a session, ensure the client session is set so supabase.auth.getUser()/getSession() work
          if (data?.session) {
            try {
              try {
              await client.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token ?? '' })
            } catch (e) {
              // ignore setSession errors, we'll still try to persist tokens below
            }
            } catch (e) {
              // ignore setSession errors, we'll still try to persist tokens below
            }
          }

          if (data?.session && data.user) {
            set({ user: { username: data.user.email || '', isAdmin: false }, isAuthenticated: true })
            // Immediately persist the same shape to avoid async rehydration overwriting this state
            try {
              const toSave = { state: { user: { username: data.user.email || '', isAdmin: false }, isAuthenticated: true } }
              localStorage.setItem('vinc-auth-storage', JSON.stringify(toSave))
            } catch (e) {
              // ignore storage errors
            }
            // store token: localStorage if remember, otherwise sessionStorage
            try {
              if (remember) {
                localStorage.setItem('supabase_access_token', data.session.access_token)
                // keep legacy key for older backend integrations
                localStorage.setItem('authToken', data.session.access_token)
                if (data.session.refresh_token) localStorage.setItem('supabase_refresh_token', data.session.refresh_token)
              } else {
                sessionStorage.setItem('supabase_access_token', data.session.access_token)
                // keep legacy key for older backend integrations
                sessionStorage.setItem('authToken', data.session.access_token)
                if (data.session.refresh_token) sessionStorage.setItem('supabase_refresh_token', data.session.refresh_token)
              }
            } catch (e) {
              // ignore storage errors
            }
            // Immediately hydrate cart from local storage (user-specific or guest) so UI doesn't flash empty
            try {
              const email = data.user.email || ''
              const safe = (email || '').replace(/[^a-z0-9-_.]/gi, '_').toLowerCase()
              const userCartKey = `vinc-cart-storage-${safe}`
              const guestCartKey = 'vinc-cart-storage-guest'
              const userRaw = localStorage.getItem(userCartKey)
              const guestRaw = localStorage.getItem(guestCartKey)
              const parsedUser = userRaw ? JSON.parse(userRaw) : null
              const parsedGuest = guestRaw ? JSON.parse(guestRaw) : null
              const userItems = parsedUser?.state?.items ?? parsedUser?.items ?? []
              const guestItems = parsedGuest?.state?.items ?? parsedGuest?.items ?? []
              const itemsToUse = Array.isArray(userItems) && userItems.length ? userItems : (Array.isArray(guestItems) ? guestItems : [])
              if (itemsToUse && itemsToUse.length) {
                try { useCartStore.getState().setItems(itemsToUse) } catch (e) { /* ignore */ }
              }
              // kick off background merge of guest cart into server cart if token exists
              (async () => {
                try {
                  const token = remember ? localStorage.getItem('supabase_access_token') ?? '' : sessionStorage.getItem('supabase_access_token') ?? ''
                  if (token && Array.isArray(guestItems) && guestItems.length) {
                    for (const it of guestItems) {
                      try {
                        await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: it.id, quantity: it.quantity || 1, variant: it.variant ? JSON.stringify(it.variant) : undefined }) })
                      } catch (e) {
                        // ignore individual failures
                      }
                    }
                    try { localStorage.removeItem(guestCartKey) } catch (e) { /* ignore */ }
                  }
                } catch (e) {
                  // ignore
                }
              })()
            } catch (e) {
              // ignore hydration errors
            }
            return true
          }
          return false
        } catch (e) {
          return false
        }
      },
      signUpWithSupabase: async (email: string, password: string, remember = false) => {
        try {
          const client = supabase as unknown as SupabaseClient
          const { data, error } = await client.auth.signUp({ email, password })
          if (error) return false

          // If Supabase returns an active session on signUp (some configs do), set it and persist tokens
          if (data?.session) {
            try {
              try {
              await client.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token ?? '' })
            } catch (e) {
              // ignore
            }
            } catch (e) {
              // ignore
            }
            try {
              if (remember) {
                localStorage.setItem('supabase_access_token', data.session.access_token)
                // legacy key
                localStorage.setItem('authToken', data.session.access_token)
                if (data.session.refresh_token) localStorage.setItem('supabase_refresh_token', data.session.refresh_token)
              } else {
                sessionStorage.setItem('supabase_access_token', data.session.access_token)
                // legacy key
                sessionStorage.setItem('authToken', data.session.access_token)
                if (data.session.refresh_token) sessionStorage.setItem('supabase_refresh_token', data.session.refresh_token)
              }
            } catch (e) {
              // ignore storage errors
            }
            if (data.user) set({ user: { username: data.user.email || '', isAdmin: false }, isAuthenticated: true })
            // persist immediately to avoid rehydration issues
            try {
              const toSave2 = { state: { user: { username: data.user?.email || '', isAdmin: false }, isAuthenticated: true } }
              localStorage.setItem('vinc-auth-storage', JSON.stringify(toSave2))
            } catch (e) {
              // ignore
            }
          }

          // signUp often requires email confirmation; return whether user object exists
          return !!data.user
        } catch (e) {
          return false
        }
      },
      
      logout: async () => {
          try {
          const client = supabase as unknown as SupabaseClient
          await client.auth.signOut()
        } catch (e) {
          // ignore
        }
        // clear tokens from both storages
  try { localStorage.removeItem('supabase_access_token'); localStorage.removeItem('supabase_refresh_token'); } catch (e) { /* ignore storage errors */ }
  try { sessionStorage.removeItem('supabase_access_token'); sessionStorage.removeItem('supabase_refresh_token'); } catch (e) { /* ignore storage errors */ }
      try { localStorage.removeItem('authToken'); } catch (e) { /* ignore */ }
      try { sessionStorage.removeItem('authToken'); } catch (e) { /* ignore */ }
      try { localStorage.removeItem('vinc-auth-storage'); } catch (e) { /* ignore */ }
      try { localStorage.removeItem('vinc-auth-storage'); } catch (e) { /* ignore */ }
        set({ user: null, isAuthenticated: false });
      }
    }),
    {
      name: 'vinc-auth-storage',
    }
  )
);

// Expose store for debugging in development
if (import.meta.env.DEV) {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.__useAuthStore = useAuthStore
  } catch (e) {
    // ignore
  }
}
