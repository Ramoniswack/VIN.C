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
import AdminOrders from './pages/admin/Orders'
import AdminCalendar from './pages/admin/Calendar'
import AdminSettings from './pages/admin/Settings'
import Orders from './pages/quick/OrdersPage'
import RecentlyViewed from './pages/quick/RecentlyViewedPage'
import WishlistPage from './pages/quick/WishlistPage'
import Settings from './pages/quick/SettingsPage'
import Policies from './pages/quick/PoliciesPage'
import Help from './pages/quick/HelpPage'
import Feedback from './pages/quick/FeedbackPage'
import Messages from './pages/placeholder/Messages'
import Support from './pages/placeholder/Support'
import Reviews from './pages/placeholder/Reviews'
import Profile from './pages/placeholder/Profile'

const queryClient = new QueryClient();

function AuthWatcher() {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const client = supabase as unknown as SupabaseClient

    const envAdminList = ((import.meta.env.VITE_ADMIN_EMAILS as string) || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)

    const buildHeaders = (token?: string) => {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      // Only enable the dev auth bypass when explicitly enabled with VITE_DEV_AUTH_ENABLED=true
      const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
      if (devAuthEnabled && import.meta.env && import.meta.env.DEV) {
  if (String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true') headers['X-ADMIN'] = '1'
        headers['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
      }
      if (token) headers.Authorization = `Bearer ${token}`
      return headers
    }

    const fetchAdminList = async (): Promise<string[]> => {
      try {
        const resp = await fetch('/api/admin/emails', { headers: buildHeaders() })
        if (!resp.ok) throw new Error('no admin API')
        const json = await resp.json()
        const server = (json.emails || []).map((s: string) => s.toLowerCase())
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

    const sync = async () => {
      try {
        const adminList = await fetchAdminList()
        const s = await client.auth.getSession()
        const supaUser = s?.data?.session?.user ?? null

        // Determine an email to use: prefer Supabase session user, otherwise
        // fall back to the locally persisted auth store (useful in dev).
        let email = supaUser?.email ?? ''
        if (!email) {
          const local = useAuthStore.getState().user
          if (local && local.username) email = local.username
        }
        if (!email) return

        const detectedIsAdmin = isAdminEmail(email, adminList)
        const prevIsAdmin = useAuthStore.getState().user?.isAdmin ?? false
        const isAdmin = detectedIsAdmin || prevIsAdmin
        const current = useAuthStore.getState()
        if (!current.isAuthenticated) {
          useAuthStore.setState({ user: { username: email, isAdmin }, isAuthenticated: true })
        }

        // upsert user (rate-limited)
        try {
          const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
          const last = Number(sessionStorage.getItem('vinc-upsert-last') || '0') || 0
          const now = Date.now()
          if (now - last > 1000 * 60 * 5) {
            // If we have a Supabase user, try to get richer metadata; otherwise
            // fall back to local store values.
            const metadata = supaUser ? ((supaUser as unknown as Record<string, unknown>)?.user_metadata ?? undefined) : undefined
            const supabaseId = supaUser ? ((supaUser as unknown as Record<string, unknown>)?.id ?? undefined) : undefined
            const nameFromMeta = (metadata && (metadata as Record<string, unknown>)['full_name']) ?? (metadata && (metadata as Record<string, unknown>)['name']) ?? undefined
            const headers = buildHeaders(token)
            const resp = await fetch('/api/users/upsert', { method: 'POST', headers, body: JSON.stringify({ email, name: nameFromMeta, supabaseId }) })
            sessionStorage.setItem('vinc-upsert-last', String(now))
            if (!resp.ok) {
              try { const json = await resp.json(); console.debug('User upsert response', json?.error ?? resp.statusText) } catch { console.debug('User upsert failed with status', resp.status) }
            }
          }
        } catch (e) {
          console.debug('User upsert failed')
        }

        // merge guest cart (only when token present)
        try {
          const guestRaw = localStorage.getItem('vinc-cart-storage-guest')
          const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
          if (guestRaw && token) {
            const parsed = JSON.parse(guestRaw)
            const items = parsed?.state?.items ?? parsed?.items ?? []
            for (const it of items) {
              try {
                await fetch('/api/cart', { method: 'POST', headers: buildHeaders(token), body: JSON.stringify({ productId: it.id, quantity: it.quantity || 1, variant: it.variant ? JSON.stringify(it.variant) : undefined }) })
              } catch (e) { /* ignore individual item failures */ }
            }
            try { localStorage.removeItem('vinc-cart-storage-guest') } catch (e) { console.warn('clear guest cart failed', e) }
          }
        } catch (e) { /* ignore */ }

        // merge guest wishlist (only when token present)
        try {
          const guestRaw = localStorage.getItem('vinc-wishlist-storage-guest')
          const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
          if (guestRaw && token) {
            const parsed = JSON.parse(guestRaw)
            const items = parsed?.state?.items ?? parsed?.items ?? []
            for (const it of items) {
              try {
                await fetch('/api/wishlist', { method: 'POST', headers: buildHeaders(token), body: JSON.stringify({ productId: it.productId ?? it.id }) })
              } catch (e) { /* ignore individual item failures */ }
            }
            try { localStorage.removeItem('vinc-wishlist-storage-guest') } catch (e) { console.warn('clear guest wishlist failed', e) }
          }
        } catch (e) { /* ignore */ }

        // fetch server cart
        try {
          const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
          const resp = await fetch('/api/cart', { headers: buildHeaders(token) })
          if (resp.ok) {
            const json = await resp.json()
              try { console.debug('Fetched /api/cart', json); (window as unknown as { __lastCartFetch?: unknown }).__lastCartFetch = json } catch (e) { /* ignore */ }
              type ServerCartItem = { id?: number; productId?: number; quantity?: number; variant?: string | null; product?: { id?: number; title?: string; price?: number; images?: string[] } }
              const items: Array<{ id: number; name: string; price: number; image: string; variant?: unknown; quantity: number }> = Array.isArray(json.items) ? (json.items as ServerCartItem[]).map((it) => ({ id: Number(it.product?.id ?? it.productId ?? it.id ?? 0), name: it.product?.title ?? '', price: it.product?.price ?? 0, image: (it.product?.images && it.product.images[0]) || '', variant: it.variant ? (typeof it.variant === 'string' ? (() => { try { return JSON.parse(it.variant as string) } catch { return undefined } })() : it.variant) : undefined, quantity: it.quantity ?? 1 })) : []
            try {
              // Merge server cart with local cart to avoid wiping optimistic local additions.
              const local = useCartStore.getState().items || []
              const keyFor = (it: { id?: number; variant?: unknown }) => {
                let v = ''
                const variant = it.variant
                if (variant && typeof variant === 'object') {
                  const asObj = variant as Record<string, unknown>
                  v = String(asObj['size'] ?? asObj['color'] ?? '')
                }
                return `${it.id}-${v || ''}`
              }
              const map = new Map<string, { id: number; name: string; price: number; image: string; variant?: unknown; quantity: number }>()
              // add server items first
              for (const it of items) map.set(keyFor(it), it)
              // merge/append local items that aren't present on server, or keep higher quantity
              for (const l of local) {
                const k = keyFor(l)
                const s = map.get(k)
                if (!s) map.set(k, l)
                else {
                  // prefer the larger quantity so we don't lose optimistic increments
                  const qtyLocal = l.quantity ?? 0
                  const qtyServer = s.quantity ?? 0
                  if (qtyLocal > qtyServer) map.set(k, { ...s, quantity: qtyLocal })
                }
              }
              const merged = Array.from(map.values())
              useCartStore.getState().setItems(merged)
            } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }

        // fetch wishlist
        try {
          const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
          const resp = await fetch('/api/wishlist', { headers: buildHeaders(token) })
          if (resp.ok) {
            const json = await resp.json()
            try { console.debug('Fetched /api/wishlist', json); (window as unknown as { __lastWishlistFetch?: unknown }).__lastWishlistFetch = json } catch (e) { /* ignore */ }
            type ServerWishlistItem = { id?: number; productId?: number; product?: { id?: number; title?: string; images?: string[] } }
            const items: Array<{ id: number; productId?: number; title?: string; image?: string }> = Array.isArray(json.items) ? (json.items as ServerWishlistItem[]).map((it) => ({ id: Number(it.id ?? it.productId ?? it.product?.id ?? 0), productId: it.productId ?? it.product?.id, title: it.product?.title ?? '', image: it.product?.images?.[0] ?? '' })) : []
            try {
              // Merge server wishlist with local wishlist to avoid wiping optimistic local additions.
              const local = useWishlistStore.getState().items || []
              const serverMap = new Map<number, { id: number; productId?: number; title?: string; image?: string }>()
              for (const it of items) serverMap.set(Number(it.id ?? it.productId ?? 0), it)
              for (const l of local) {
                const pid = Number(l.productId ?? l.id)
                if (!serverMap.has(pid)) {
                  serverMap.set(pid, {
                    id: Number(l.id ?? pid) || 0,
                    productId: l.productId ? Number(l.productId) : (Number(l.id) || undefined),
                    title: l.title ?? '',
                    image: l.image ?? ''
                  })
                }
              }
              const merged = Array.from(serverMap.values()).map((v) => ({ id: v.id ?? 0, productId: v.productId, title: v.title ?? '', image: v.image ?? '' }))
              useWishlistStore.getState().setItems(merged)
            } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
      } catch (e) {
        console.error('AuthWatcher sync error', e)
      }
    }

    sync()

    const { data: listener } = client.auth.onAuthStateChange(async (_event, session) => {
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

        // upsert on auth change
        try {
          const last = Number(sessionStorage.getItem('vinc-upsert-last') || '0') || 0
          const now = Date.now()
          if (now - last > 1000 * 60 * 5) {
            const metadata = (user as unknown as Record<string, unknown>)?.user_metadata ?? undefined
            const supabaseId = (user as unknown as Record<string, unknown>)?.id ?? undefined
            const nameFromMeta = (metadata && (metadata as Record<string, unknown>)['full_name']) ?? (metadata && (metadata as Record<string, unknown>)['name']) ?? undefined
            const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
            const resp = await fetch('/api/users/upsert', { method: 'POST', headers: buildHeaders(token), body: JSON.stringify({ email, name: nameFromMeta, supabaseId }) })
            sessionStorage.setItem('vinc-upsert-last', String(now))
            if (!resp.ok) {
              try { const json = await resp.json(); console.debug('User upsert response', json?.error ?? resp.statusText) } catch { console.debug('User upsert failed with status', resp.status) }
            }
          }
        } catch (e) { console.debug('User upsert failed') }

        // fetch cart on auth change
        try {
          const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
          const resp = await fetch('/api/cart', { headers: buildHeaders(token) })
          if (resp.ok) {
            const json = await resp.json()
            type ServerCartItem = { id?: number; productId?: number; quantity?: number; variant?: string | null; product?: { id?: number; title?: string; price?: number; images?: string[] } }
            const items = Array.isArray(json.items) ? (json.items as ServerCartItem[]).map((it) => ({ id: it.product?.id ?? it.productId ?? it.id ?? 0, name: it.product?.title ?? '', price: it.product?.price ?? 0, image: (it.product?.images && it.product.images[0]) || '', variant: it.variant ? JSON.parse(it.variant) : undefined, quantity: it.quantity ?? 1 })) : []
            try {
              // Merge server cart with local cart on auth change
              const local = useCartStore.getState().items || []
              const keyFor = (it: { id?: number; variant?: unknown }) => {
                let v = ''
                const variant = it.variant
                if (variant && typeof variant === 'object') {
                  const asObj = variant as Record<string, unknown>
                  v = String(asObj['size'] ?? asObj['color'] ?? '')
                }
                return `${it.id}-${v || ''}`
              }
              const map = new Map<string, { id: number; name: string; price: number; image: string; variant?: unknown; quantity: number }>()
              for (const it of items) map.set(keyFor(it), it)
              for (const l of local) {
                const k = keyFor(l)
                const s = map.get(k)
                if (!s) map.set(k, l)
                else {
                  const qtyLocal = l.quantity ?? 0
                  const qtyServer = s.quantity ?? 0
                  if (qtyLocal > qtyServer) map.set(k, { ...s, quantity: qtyLocal })
                }
              }
              useCartStore.getState().setItems(Array.from(map.values()))
            } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }

        // fetch wishlist on auth change
        try {
          const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
          const resp = await fetch('/api/wishlist', { headers: buildHeaders(token) })
          if (resp.ok) {
            const json = await resp.json()
            type ServerWishlistItem = { id?: number; productId?: number; product?: { id?: number; title?: string; images?: string[] } }
            const items = Array.isArray(json.items) ? (json.items as ServerWishlistItem[]).map((it) => ({ id: it.id ?? it.productId ?? it.product?.id ?? 0, productId: it.productId ?? it.product?.id, title: it.product?.title ?? '', image: it.product?.images?.[0] ?? '' })) : []
            try {
              // Merge server wishlist with local wishlist on auth change
              const local = useWishlistStore.getState().items || []
              const serverMap = new Map<number, { id: number; productId?: number; title?: string; image?: string }>()
              for (const it of items) serverMap.set(Number(it.id ?? it.productId ?? 0), it)
              for (const l of local) {
                const pid = Number(l.productId ?? l.id)
                if (!serverMap.has(pid)) {
                  serverMap.set(pid, {
                    id: Number(l.id ?? pid) || 0,
                    productId: l.productId ? Number(l.productId) : (Number(l.id) || undefined),
                    title: l.title ?? '',
                    image: l.image ?? ''
                  })
                }
              }
              const merged = Array.from(serverMap.values()).map((v) => ({ id: v.id ?? 0, productId: v.productId, title: v.title ?? '', image: v.image ?? '' }))
              useWishlistStore.getState().setItems(merged)
            } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }

      } else {
        useAuthStore.setState({ user: null, isAuthenticated: false })
      }
    })

    return () => {
      try {
        // listener may be in different shapes across supabase versions - use a small union type
        type ListenerWithUnsub = { unsubscribe?: () => void } | { subscription?: { unsubscribe?: () => void } }
        const l = listener as unknown as ListenerWithUnsub | null
        if (!l) return
        if (typeof (l as { unsubscribe?: unknown }).unsubscribe === 'function') {
          ;(l as { unsubscribe?: () => void }).unsubscribe!()
          return
        }
        if ((l as { subscription?: { unsubscribe?: unknown } }).subscription && typeof (l as { subscription?: { unsubscribe?: unknown } }).subscription!.unsubscribe === 'function') {
          ;(l as { subscription?: { unsubscribe?: () => void } }).subscription!.unsubscribe!()
        }
      } catch (e) { /* ignore */ }
    }
  }, [navigate, location.pathname, location.search, location.hash])

  return null
}

function ScrollToTopOnRoute() {
  const location = useLocation()
  useEffect(() => {
    // always scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    // if user clicks a link to the same href, ensure we scroll to top
    const onDocClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      const a = el.closest('a') as HTMLAnchorElement | null
      if (!a || !a.href) return
      try {
        const url = new URL(a.href)
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } catch (err) { /* ignore */ }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthWatcher />
          <ScrollToTopOnRoute />
          {/* Quick actions floating removed per design: vertical quick-action nav was deleted */}
          <TooltipProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/lookbook" element={<Lookbook />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/new" element={<NewPage />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
              <Route path="/admin/products/add" element={<RequireAdmin><AddProduct /></RequireAdmin>} />
              <Route path="/admin/products/new" element={<RequireAdmin><AddProduct /></RequireAdmin>} />
              <Route path="/admin/products/:id/edit" element={<RequireAdmin><EditProduct /></RequireAdmin>} />
              <Route path="/admin/products/:id" element={<RequireAdmin><ViewProduct /></RequireAdmin>} />
              <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
              <Route path="/admin/calendar" element={<RequireAdmin><AdminCalendar /></RequireAdmin>} />
              <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
              <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
              <Route path="/recently-viewed" element={<RequireAuth><RecentlyViewed /></RequireAuth>} />
              <Route path="/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/help" element={<Help />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
              <Route path="/support" element={<Support />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}


