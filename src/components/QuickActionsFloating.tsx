import React from 'react'
import { Package2, Clock, Heart, ShoppingCart, Settings } from 'lucide-react'
import { IconButton } from '@/components/ui/button'
import { useNavigate, useLocation } from 'react-router-dom'

export default function QuickActionsFloating() {
  const navigate = useNavigate()
  const location = useLocation()

  const allowed = ['/dashboard']
  const show = allowed.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))
  if (!show) return null

  const actions = [
    { id: 'orders', icon: <Package2 className="w-5 h-5" />, label: 'Orders', href: '/orders' },
    { id: 'recent', icon: <Clock className="w-5 h-5" />, label: 'Recently viewed', href: '/recently-viewed' },
    { id: 'wishlist', icon: <Heart className="w-5 h-5" />, label: 'Wishlist', href: '/wishlist' },
    { id: 'cart', icon: <ShoppingCart className="w-5 h-5" />, label: 'Cart', href: '/cart' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/settings' }
  ]

  return (
    <div className="fixed right-4 bottom-16 z-50 flex flex-col items-center space-y-3">
      {actions.map(a => (
        <IconButton key={a.id} variant="ghost" size="icon" ariaLabel={a.label} onClick={() => { navigate(a.href); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          {a.icon}
        </IconButton>
      ))}
    </div>
  )
}
