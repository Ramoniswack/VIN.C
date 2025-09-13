import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Lookbook from "./pages/Lookbook";
import Collections from "./pages/Collections";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import RequireAuth from '@/components/RequireAuth'
import RequireAdmin from '@/components/RequireAdmin'
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import ViewProduct from "./pages/admin/ViewProduct";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import NewPage from "./pages/New";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthWatcher />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/lookbook" element={<Lookbook />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/new" element={<NewPage />} />
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/admin/products/new" element={<RequireAdmin><AddProduct /></RequireAdmin>} />
            <Route path="/admin/products/edit/:productId" element={<RequireAdmin><EditProduct /></RequireAdmin>} />
            <Route path="/admin/products/view/:id" element={<RequireAdmin><ViewProduct /></RequireAdmin>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

function AuthWatcher() {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const client = supabase as unknown as SupabaseClient

    const envAdminList = ((import.meta.env.VITE_ADMIN_EMAILS as string) || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)

    const fetchAdminList = async (): Promise<string[]> => {
      try {
        const resp = await fetch('/api/admin/emails')
        if (!resp.ok) throw new Error('no admin API')
        const json = await resp.json()
        const server = (json.emails || []).map((s: string) => s.toLowerCase())
        // merge env list and server list, prefer uniqueness
        return Array.from(new Set([...envAdminList, ...server]))
      } catch (e) {
        return envAdminList
      }
    }

    const isAdminEmail = (email?: string, list?: string[]) => {
      if (!email) return false
      const lookup = list ?? envAdminList
      return lookup.includes(email.toLowerCase())
    }

    // sync existing session on load: fetch admin list, upsert user, and merge guest cart
    const sync = async () => {
      try {
        const adminList = await fetchAdminList()
        const s = await client.auth.getSession()
        const user = s?.data?.session?.user ?? null
        if (user) {
          const email = user.email ?? ''
          const detectedIsAdmin = isAdminEmail(email, adminList)
          // preserve any previously-known admin flag if detection fails or list is empty
          const prevIsAdmin = useAuthStore.getState().user?.isAdmin ?? false
          const isAdmin = detectedIsAdmin || prevIsAdmin
          // Do not overwrite an existing authenticated session (e.g. AdminLogin)
          const current = useAuthStore.getState()
          if (!current.isAuthenticated) {
            useAuthStore.setState({ user: { username: email, isAdmin }, isAuthenticated: true })
          }

          // NOTE: Do NOT auto-redirect admins here. AdminLogin explicitly routes
          // to `/admin` after successful sign-in. Allow admins to browse the
          // public site without being forced back to the admin dashboard.

          // upsert user to backend (best-effort) but rate-limit attempts and
          // avoid logging full server error objects which can be noisy.
          try {
            const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
            if (token) {
              const last = Number(sessionStorage.getItem('vinc-upsert-last') || '0') || 0
              const now = Date.now()
              // skip if we attempted upsert within the last 5 minutes
              if (now - last > 1000 * 60 * 5) {
                const metadata = (user as unknown as Record<string, unknown>)?.user_metadata ?? undefined
                const supabaseId = (user as unknown as Record<string, unknown>)?.id ?? undefined
                const nameFromMeta = (metadata && (metadata as Record<string, unknown>)['full_name']) ?? (metadata && (metadata as Record<string, unknown>)['name']) ?? undefined
                const resp = await fetch('/api/users/upsert', {
                  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ email, name: nameFromMeta, supabaseId })
                })
                sessionStorage.setItem('vinc-upsert-last', String(now))
                if (!resp.ok) {
                  try { const json = await resp.json(); console.debug('User upsert response', json?.error ?? resp.statusText) } catch { console.debug('User upsert failed with status', resp.status) }
                }
              }
            }
          } catch (e) {
            console.debug('User upsert failed')
          }

          // merge guest cart from localStorage into server cart (best-effort)
          try {
            const guestRaw = localStorage.getItem('vinc-cart-storage-guest')
            const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
            if (guestRaw && token) {
              const parsed = JSON.parse(guestRaw)
              const items = parsed?.state?.items ?? parsed?.items ?? []
              for (const it of items) {
                try {
                  await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: it.id, quantity: it.quantity || 1, variant: it.variant ? JSON.stringify(it.variant) : undefined }) })
                } catch (e) {
                  /* ignore individual item failures */
                }
              }
              // clear guest cart once merged
              try { localStorage.removeItem('vinc-cart-storage-guest') } catch (e) { console.warn('clear guest cart failed', e) }
            }
          } catch (e) {
            // ignore merge errors
          }
          // fetch server cart and hydrate local cart store
          try {
            const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
            if (token) {
              const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
              const resp = await fetch('/api/cart', { headers })
              if (resp.ok) {
                const json = await resp.json()
                type ServerCartItem = { id?: number; productId?: number; quantity?: number; variant?: string | null; product?: { id?: number; title?: string; price?: number; images?: string[] } }
                const items = Array.isArray(json.items) ? (json.items as ServerCartItem[]).map((it) => ({ id: it.product?.id ?? it.productId ?? it.id ?? 0, name: it.product?.title ?? '', price: it.product?.price ?? 0, image: (it.product?.images && it.product.images[0]) || '', variant: it.variant ? JSON.parse(it.variant) : undefined, quantity: it.quantity ?? 1 })) : []
                try { useCartStore.getState().setItems(items) } catch (e) { /* ignore */ }
              }
            }
          } catch (e) {
            // ignore
          }
          // fetch wishlist and hydrate
          try {
            const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
            if (token) {
              const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
              const resp = await fetch('/api/wishlist', { headers })
              if (resp.ok) {
                const json = await resp.json()
                type ServerWishlistItem = { id?: number; productId?: number; product?: { id?: number; title?: string; images?: string[] } }
                const items = Array.isArray(json.items) ? (json.items as ServerWishlistItem[]).map((it) => ({ id: it.id ?? it.productId ?? it.product?.id ?? 0, productId: it.productId ?? it.product?.id, title: it.product?.title ?? '', image: it.product?.images?.[0] ?? '' })) : []
                try { useWishlistStore.getState().setItems(items) } catch (e) { /* ignore */ }
              }
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.error('AuthWatcher sync error', e)
      }
    }
    sync()

    // listen to auth state changes
      const { data: listener } = client.auth.onAuthStateChange(async (event, session) => {
      const adminList = await fetchAdminList()
      const user = session?.user ?? null
  if (user) {
  const email = user.email ?? ''
  const detectedIsAdmin = isAdminEmail(email, adminList)
  const prevIsAdmin = useAuthStore.getState().user?.isAdmin ?? false
  const isAdmin = detectedIsAdmin || prevIsAdmin
  const current = useAuthStore.getState()
  if (!current.isAuthenticated) {
    useAuthStore.setState({ user: { username: email, isAdmin }, isAuthenticated: true })
  }

        // NOTE: we intentionally do NOT auto-navigate to `/admin` here. The
        // `AdminLogin` flow is responsible for sending an admin user to the
        // admin dashboard. Leaving navigation control to explicit login flows
        // avoids surprising redirects when admins browse the site.

  // upsert user on auth changes (login)
        try {
          const last = Number(sessionStorage.getItem('vinc-upsert-last') || '0') || 0
          const now = Date.now()
          if (now - last > 1000 * 60 * 5) {
            const metadata = (user as unknown as Record<string, unknown>)?.user_metadata ?? undefined
            const supabaseId = (user as unknown as Record<string, unknown>)?.id ?? undefined
            const nameFromMeta = (metadata && (metadata as Record<string, unknown>)['full_name']) ?? (metadata && (metadata as Record<string, unknown>)['name']) ?? undefined
            const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
            const resp = await fetch('/api/users/upsert', {
              method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({ email, name: nameFromMeta, supabaseId })
            })
            sessionStorage.setItem('vinc-upsert-last', String(now))
            if (!resp.ok) {
              try { const json = await resp.json(); console.debug('User upsert response', json?.error ?? resp.statusText) } catch { console.debug('User upsert failed with status', resp.status) }
            }
          }
        } catch (e) {
          console.debug('User upsert failed')
        }
        // fetch server cart and hydrate local cart store on auth change
        try {
          const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (token) headers.Authorization = `Bearer ${token}`
          const resp = await fetch('/api/cart', { headers })
          if (resp.ok) {
            const json = await resp.json()
            type ServerCartItem = { id?: number; productId?: number; quantity?: number; variant?: string | null; product?: { id?: number; title?: string; price?: number; images?: string[] } }
            const items = Array.isArray(json.items) ? (json.items as ServerCartItem[]).map((it) => ({ id: it.product?.id ?? it.productId ?? it.id ?? 0, name: it.product?.title ?? '', price: it.product?.price ?? 0, image: (it.product?.images && it.product.images[0]) || '', variant: it.variant ? JSON.parse(it.variant) : undefined, quantity: it.quantity ?? 1 })) : []
            try { useCartStore.getState().setItems(items) } catch (e) { /* ignore */ }
          }
        } catch (e) {
          // ignore
        }
        } else {
        // clear auth state when signed out but do NOT force navigation to the login page.
        // This lets public pages remain viewable. Only protected routes use `RequireAuth`.
        useAuthStore.setState({ user: null, isAuthenticated: false })
      }
    })

    return () => {
      // listener may expose unsubscribe in different shapes depending on supabase version
      type ListenerShape = { subscription?: { unsubscribe?: () => void }; unsubscribe?: () => void }
      const l = (listener as unknown) as ListenerShape | undefined
      try {
        if (l?.subscription?.unsubscribe) l.subscription.unsubscribe()
        else if (l?.unsubscribe) l.unsubscribe()
      } catch (e) {
        // ignore cleanup errors
      }
    }
  }, [navigate, location.pathname, location.search, location.hash])

  return null
}
