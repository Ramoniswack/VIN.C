import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Link } from 'react-router-dom'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { useWishlistStore } from '@/store/wishlistStore'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore()
  const wishlist = useWishlistStore(state => state.items)
  const removeWishlist = useWishlistStore(state => state.remove)
  const updateWishlist = useWishlistStore(state => state.update)
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | string | null>(null)
  const [editingValue, setEditingValue] = React.useState('')

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

      <main className="container mx-auto px-4 pt-28 pb-16 flex-1">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-display font-medium text-paper">Your Dashboard</h1>
              <p className="text-graphite mt-1">Welcome back, {user?.username}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setConfirmOpen(true)}>Logout</Button>
            </div>
          </div>

          <section className="rounded-md border border-graphite/30 p-6 bg-surface">
            <h2 className="text-xl font-medium mb-2">Account</h2>
            <p className="text-sm text-graphite">Signed in as <strong>{user?.username}</strong></p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/shop"><Button variant="ghost">Continue shopping</Button></Link>
              <Link to="/cart"><Button variant="outline">View cart ({getTotalItems()})</Button></Link>
              <Link to="/collections"><Button variant="ghost">Collections</Button></Link>
            </div>
          </section>

          <section className="rounded-md border border-graphite/30 p-6 bg-surface">
            <h2 className="text-xl font-medium mb-2">Your Wishlist</h2>
            {wishlist.length === 0 ? (
              <div className="text-sm text-graphite">No items in your wishlist.</div>
            ) : (
              <ul className="space-y-2">
                {wishlist.map((it) => (
                  <li key={String(it.id)} className="flex justify-between items-center bg-card p-3 rounded">
                    <div className="flex-1">
                      {editingId === it.id ? (
                        <input className="w-full bg-transparent border-b border-graphite/20 py-1" value={editingValue} onChange={(e) => setEditingValue(e.target.value)} />
                      ) : (
                        <div className="font-medium">{it.title}</div>
                      )}
                      <div className="text-xs text-graphite">Product ID: {it.productId ?? it.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === it.id ? (
                        <>
                          <Button variant="ghost" onClick={() => {
                            updateWishlist(it.id, { title: editingValue })
                            // persist to server if possible
                            try {
                              const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
                              if (token) fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: it.productId ?? it.id }) })
                            } catch (e) { /* ignore */ }
                            setEditingId(null)
                          }}>Save</Button>
                          <Button variant="outline" onClick={() => { setEditingId(null); setEditingValue('') }}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" onClick={() => navigate(`/product/${it.productId ?? it.id}`)}>View</Button>
                          <Button variant="outline" onClick={() => { setEditingId(it.id); setEditingValue(it.title ?? '') }}>Edit</Button>
                          <Button variant="destructive" onClick={async () => {
                            // remove locally
                            removeWishlist(it.id)
                            // try remove on server if authenticated
                            try {
                              const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
                              if (token) await fetch('/api/wishlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: it.productId ?? it.id }) })
                            } catch (e) { /* ignore */ }
                          }}>Remove</Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-md border border-graphite/30 p-6 bg-surface">
            <h2 className="text-xl font-medium mb-2">Your Cart</h2>
            <p className="text-sm text-graphite mb-3">{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} — ${getTotalPrice().toFixed(2)}</p>
            {items.length === 0 ? (
              <div className="text-sm text-graphite">Your cart is empty.</div>
            ) : (
              <ul className="space-y-2">
                {items.map((it, idx) => (
                  <li key={idx} className="flex justify-between bg-card p-3 rounded">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-graphite">Qty: {it.quantity} • {it.variant?.size ?? ''}</div>
                    </div>
                    <div>${(it.price * it.quantity).toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            )}
            {items.length > 0 && (
              <div className="mt-4">
                <Button variant="destructive" onClick={() => clearCart()}>Clear cart</Button>
              </div>
            )}
          </section>
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
