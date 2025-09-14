import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
// cart store not used in the simplified dashboard
import { Button, IconButton } from '@/components/ui/button'
import { Settings, HelpCircle, LogOut, MessageSquare, Package2, Heart, ShoppingCart, Clock, Star, Headphones, MessageCircle } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Link } from 'react-router-dom'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
// wishlist preview removed from dashboard; keep wishlist page intact elsewhere
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  // simplified dashboard: local cart/wishlist panels removed
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | string | null>(null)
  const [editingValue, setEditingValue] = React.useState('')
  // intentionally keep dashboard focused on quick actions; no panels in main view

  const [wishlistItems, setWishlistItems] = React.useState<Array<Record<string, unknown>>>([])
  const [cartItems, setCartItems] = React.useState<Array<Record<string, unknown>>>([])
  // dev-aware headers for server endpoints (mirrors server dev-bypass behavior)
  const [serverCartTotalCents, setServerCartTotalCents] = React.useState<number | null>(null)
  const [serverCartItemCount, setServerCartItemCount] = React.useState<number | null>(null)
  const [serverWishlistCount, setServerWishlistCount] = React.useState<number | null>(null)
  const buildHeaders = React.useCallback(() => {
    const headers: Record<string,string> = { 'Content-Type': 'application/json' }
    try {
      // include any local stored supabase token so server can authenticate the user
      const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
      if (token) headers.Authorization = `Bearer ${token}`
    const isDev = Boolean(import.meta.env && (import.meta.env.DEV as boolean))
    // Only enable dev bypass when explicitly allowed via VITE_DEV_AUTH_ENABLED
    const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
    if (isDev && devAuthEnabled) headers['X-ADMIN'] = '1'
      // Prefer explicit user email header when we have a logged-in user (normalize to lowercase)
      if (user?.username) {
        try { headers['X-USER-EMAIL'] = String(user.username).trim().toLowerCase() } catch (e) { headers['X-USER-EMAIL'] = String(user.username) }
      } else if (isDev) {
        // fallback to configured dev email when available
        headers['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
      }
    } catch (e) { /* ignore */ }
    return headers
  }, [user?.username])
  

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const headers = buildHeaders()
        const respW = await fetch('/api/wishlist', { headers })
        const jw = await respW.json().catch(() => ({ items: [] }))
        const respC = await fetch('/api/cart', { headers })
        const jc = await respC.json().catch(() => ({ items: [] }))
        const respO = await fetch('/api/users/me/orders', { headers })
        const jo = await respO.json().catch(() => ({ orders: [] }))
        const respP = await fetch('/api/users/me/progress', { headers })
        const jp = await respP.json().catch(() => ({ points: 0, level: 1 }))
        if (!mounted) return
        const serverWishlist = jw.items || []
        const serverCart = jc.items || []
        setWishlistItems(serverWishlist)
        setCartItems(serverCart)
        // store server-provided authoritative totals/counts when present
        try {
          if (jc && typeof (jc.totalCents) === 'number') setServerCartTotalCents(Number(jc.totalCents))
          if (jc && typeof (jc.totalItems) === 'number') setServerCartItemCount(Number(jc.totalItems))
          if (jw && typeof (jw.count) === 'number') setServerWishlistCount(Number(jw.count))
        } catch (e) { /* ignore */ }
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedCart = (serverCart as Array<any> || []).map((c) => ({
            id: Number((c.product && c.product.id) || c.productId || c.id),
            name: (c.product && (c.product.title || '')) || '',
            price: Number(((c.product && c.product.price) || 0) as number) / 100,
            image: (c.product && Array.isArray(c.product.images) ? c.product.images[0] : '') || '',
            variant: c.variant ? c.variant : undefined,
            quantity: Number(c.quantity || 1)
          }))
          try { useCartStore.getState().setItems(mappedCart) } catch (e) { /* ignore */ }
        } catch (e) { /* ignore */ }
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedWishlist = (serverWishlist as Array<any> || []).map((w) => ({ id: w.id, productId: (w.product && w.product.id) || null, title: (w.product && w.product.title) || '', image: (w.product && Array.isArray(w.product.images) ? w.product.images[0] : '') || '' }))
          try { useWishlistStore.getState().setItems(mappedWishlist) } catch (e) { /* ignore */ }
        } catch (e) { /* ignore */ }
        // clear guest localStorage once we've successfully loaded server state for an authenticated user
        try {
          if (isAuthenticated) {
            try { localStorage.removeItem('vinc-cart-storage-guest') } catch (e) { /* ignore */ }
            try { localStorage.removeItem('vinc-wishlist-storage-guest') } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
        // orders and progress removed from dashboard per user request
      } catch (e) {
        console.warn('dashboard load failed', e)
      }
    }
    load()
    // refresh when the tab regains focus or when other components dispatch a data-change event
    function onFocus() { load() }
    function onDataChanged() { load() }
    window.addEventListener('focus', onFocus)
    window.addEventListener('vinc:data-changed', onDataChanged)
    return () => { mounted = false; window.removeEventListener('focus', onFocus); window.removeEventListener('vinc:data-changed', onDataChanged) }
  }, [isAuthenticated, user?.username, buildHeaders])


  // compute cart totals (assume product.price is in cents)
  const cartTotalCents = cartItems.reduce((s, it) => {
    const product = (it as unknown as Record<string, unknown>)?.product as Record<string, unknown> | undefined
    const price = Number((product && (product.price as number)) || 0)
    const qty = Number(((it as unknown as Record<string, unknown>).quantity) || 0)
    return s + (price * qty)
  }, 0)
  // if server provided authoritative totals, prefer them
  const effectiveCartTotalCents = serverCartTotalCents !== null ? serverCartTotalCents : cartTotalCents
  const cartTotal = (Number(effectiveCartTotalCents) / 100).toFixed(2)
  const cartItemCount = serverCartItemCount !== null ? serverCartItemCount : cartItems.reduce((s, it) => s + (Number(((it as unknown) as Record<string, unknown>).quantity) || 0), 0)
  const wishlistCount = serverWishlistCount !== null ? serverWishlistCount : wishlistItems.length

  // recentActivity removed per user request; dashboard will show Account Level only

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-6 bg-surface border rounded">Please log in to view your dashboard.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navigation />

      <main className="min-h-[70vh] px-4 pt-28 pb-16 flex-1 flex items-start justify-center">
        <div className="w-full max-w-5xl">
          <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-display font-medium text-paper">Your Dashboard</h1>
              <p className="text-graphite mt-1">Welcome back, {user?.username}</p>
              {/* Top summary cards removed as requested */}
            </div>
            <div className="flex items-center">
              <div className="hidden md:flex flex-col items-center space-y-2">
                {/* Settings above Logout - icon-only controls */}
                <Link to="/settings"><IconButton variant="ghost" size="icon" ariaLabel="Settings"><Settings className="w-4 h-4" /></IconButton></Link>
                <IconButton variant="ghost" size="icon" ariaLabel="Logout" onClick={() => setConfirmOpen(true)}><LogOut className="w-4 h-4" /></IconButton>
              </div>
              <div className="md:hidden flex items-center space-x-2">
                {/* On small screens show Settings and Logout as icon-only buttons (not inside a dropdown) */}
                <Link to="/settings" className="flex items-center justify-center">
                  <IconButton variant="ghost" size="icon" ariaLabel="Settings"><Settings className="w-4 h-4" /></IconButton>
                </Link>
                <button onClick={() => { setConfirmOpen(true); (document.activeElement as HTMLElement)?.blur(); }} aria-label="Sign out">
                  <IconButton variant="ghost" size="icon" ariaLabel="Logout"><LogOut className="w-4 h-4" /></IconButton>
                </button>
              </div>
            </div>
          </div>

          {/* Wishlist panel removed to keep the dashboard as a single quick-actions container (see screenshot) */}

          {/* Quick Links */}
          <section className="rounded-md border border-graphite/30 p-6 bg-surface">
            <div role="group" aria-label="Dashboard actions" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { key: 'orders', label: 'My Orders', icon: <Package2 className="w-6 h-6 mb-2" /> , to: '/orders'},
                { key: 'recent', label: 'Recently Viewed', icon: <Clock className="w-6 h-6 mb-2" />, to: '/recently-viewed'},
                { key: 'wishlist', label: 'Wishlist', icon: <Heart className="w-6 h-6 mb-2" />, to: '/wishlist'},
                { key: 'cart', label: 'Cart', icon: <ShoppingCart className="w-6 h-6 mb-2" />, to: '/cart'},
              ].map((c) => (
                <Tooltip key={c.key}>
                  <TooltipTrigger asChild>
                    <button title={c.label} className="relative flex flex-col items-center p-3 bg-card rounded hover:shadow transform transition duration-300 ease-in-out hover:scale-[1.02]" onClick={() => navigate(c.to)}>
                      {/* For wishlist, color the heart when there are items */}
                      {c.key === 'wishlist' ? (
                        <Heart className={`w-6 h-6 mb-2 ${wishlistCount > 0 ? 'text-red-600' : 'text-graphite'}`} />
                      ) : c.icon}
                      <span className="text-xs">{c.label}</span>
                      {c.key === 'wishlist' && (wishlistCount > 0) ? (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-medium leading-none text-white bg-red-600 rounded-full">{wishlistCount}</span>
                      ) : null}
                      {c.key === 'cart' && cartItemCount > 0 ? (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-medium leading-none text-white bg-primary rounded-full">{cartItemCount}</span>
                      ) : null}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{c.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>

              {/* Recent Activity and Account Level removed per user request */}

            {/* Additional quick items: Customer Care, Reviews, Messages - placed below Recent Activity and Progress */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'support', label: 'Customer Care', desc: 'Open a support request', to: '/support', icon: <Headphones className="w-6 h-6 mb-2" /> },
                { key: 'reviews', label: 'Reviews', desc: 'See your product reviews', to: '/reviews', icon: <Star className="w-6 h-6 mb-2" /> },
                { key: 'messages', label: 'Messages', desc: 'Direct messages and inquiries', to: '/messages', icon: <MessageCircle className="w-6 h-6 mb-2" /> }
              ].map((it) => (
                <div key={it.key} className="p-4 bg-card rounded shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">{it.icon}<span>{it.label}</span></div>
                    <div className="text-xs text-graphite mt-2">{it.desc}</div>
                  </div>
                  <div className="mt-4">
                    <Button className="w-full flex items-center justify-center gap-2" onClick={() => navigate(it.to)}>
                      {it.icon}
                      <span className="sr-only">{it.label}</span>
                      <span>{it.label}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Header only: user greeting is shown above; Account quick links removed per design */}

          {/* Removed duplicate wishlist panel to match simpler dashboard layout */}

          {/* Cart panel removed to keep dashboard focused on quick actions */}

            {/* Right sidebar removed to match the single-container dashboard layout */}

          {/* Back button has been moved into each panel so it's visually near the panel's close control */}

          {/* Settings moved to /settings route - removed inline to keep dashboard focused */}
          </div>
          {/* aside is the right-column sidebar (kept after the main content) */}
        </div>
      </main>

      <Footer />
      <AlertDialog open={confirmOpen} onOpenChange={(open) => setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm logout</AlertDialogTitle>
            <div className="text-sm text-graphite">Are you sure you want to sign out?</div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await useAuthStore.getState().logout(); setConfirmOpen(false); navigate('/auth') }}>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
