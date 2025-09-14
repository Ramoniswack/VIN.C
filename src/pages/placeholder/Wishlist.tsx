import React from 'react'
import Navigation from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { useWishlistStore } from '@/store/wishlistStore'

export default function WishlistPage() {
  const items = useWishlistStore(state => state.items)
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 pb-16 flex-1">
        <h1 className="text-3xl font-display">Wishlist</h1>
        <p className="mt-4 text-graphite">Your saved items.</p>
        <ul className="mt-6 space-y-3">
          {items.map(it => (
            <li key={String(it.id)} className="flex items-center gap-4 bg-card p-3 rounded">
              <div className="w-16 h-16 overflow-hidden rounded">
                <img src={it.image?.startsWith('/') ? it.image : `/${it.image}`} alt={it.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-xs text-graphite">Product ID: {it.productId ?? it.id}</div>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  )
}
