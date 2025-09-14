import React from 'react'
import { useWishlistStore } from '@/store/wishlistStore'
import QuickPageShell from '@/components/QuickPageShell'
import { IconButton } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useProductStore } from '@/store/productStore'

export default function WishlistPage() {
  const items = useWishlistStore(s => s.items)
  const navigate = useNavigate()

  return (
    <QuickPageShell title="Your Wishlist">
      {/* removed duplicate small quick-nav icon to keep only the shell's back control */}

      {items.length === 0 ? (
        <div className="rounded-md border border-graphite/20 p-6 text-center text-graphite">No items in your wishlist.</div>
      ) : (
        <ul className="space-y-4">
          {items.map(it => {
            const pid = Number(it.productId ?? it.id)
            const product = useProductStore.getState().products.find(p => p.id === pid)
            const title = it.title ?? product?.name ?? ''
            const image = it.image ?? product?.image ?? '/Products/placeholder.jpg'
            const desc = product?.description ?? ''
            const price = product ? `$${product.price.toFixed(2)}` : ''
            return (
              <li key={it.id} className="flex items-start gap-4 bg-card p-4 rounded-md">
                <div className="w-20 h-20 overflow-hidden rounded-md flex-shrink-0">
                  <img src={image} alt={title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-lg">{title}</div>
                    <div className="text-sm text-graphite">{price}</div>
                  </div>
                  {desc && <div className="text-xs text-graphite mt-1">{desc}</div>}
                </div>
                <div className="flex items-center">
                  <IconButton onClick={() => navigate(`/product/${pid}`)} ariaLabel="View product">
                    <ArrowRight className="w-4 h-4" />
                  </IconButton>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </QuickPageShell>
  )
}
