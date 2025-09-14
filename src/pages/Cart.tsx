import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button, IconButton } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { toast as sonner } from '@/components/ui/sonner'
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'

export default function Cart() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCartStore();
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shippingCost = getTotalPrice() >= 500 ? 0 : 25;
  const tax = Math.round(getTotalPrice() * 0.08); // 8% tax
  const finalTotal = getTotalPrice() + shippingCost + tax;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation />
        
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-mink/10 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-graphite" />
            </div>
            <h1 className="text-3xl font-display font-medium text-paper">Your cart is empty</h1>
            <p className="text-graphite">
              Discover our curated collection of contemporary essentials
            </p>
            <Button className="mt-6">
              Continue Shopping
            </Button>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  const handleCheckout = async () => {
    setError(null)
    setLoading(true)
    try {
      // prepare items for backend: convert prices (assume frontend stores price in dollars) to cents
      const payload = {
        items: items.map(i => ({ name: i.name, unit_amount: Math.round(i.price * 100), quantity: i.quantity, currency: 'usd' })),
        successUrl: `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/cart`,
        customerEmail: undefined
      }
      // Build headers: include Authorization when available, or dev-bypass headers in dev
      const buildHeaders = () => {
        const headers: Record<string,string> = { 'Content-Type': 'application/json' }
        try {
          const sToken = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
          if (sToken) headers.Authorization = `Bearer ${sToken}`
          const isDev = Boolean(import.meta.env && (import.meta.env.DEV as boolean))
          const devAuthEnabled = Boolean(import.meta.env && String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true')
          if (isDev && devAuthEnabled) {
            headers['X-ADMIN'] = '1'
            const username = useAuthStore.getState().user?.username ? String(useAuthStore.getState().user!.username).trim().toLowerCase() : undefined
            headers['X-USER-EMAIL'] = username ?? ((import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string)
          }
        } catch (e) { /* ignore */ }
        return headers
      }

      // include customerEmail when available so server can associate order with user
      try {
        const user = useAuthStore.getState().user
        if (user && user.username) payload.customerEmail = String(user.username).trim().toLowerCase()
      } catch (e) { /* ignore */ }

      const resp = await fetch('/api/stripe/checkout', { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) })
      const body = await resp.json()
      if (!resp.ok) throw new Error(body?.error || 'checkout failed')
      // redirect to hosted url if provided, otherwise fallback to Stripe checkout url pattern
      if (body.url) {
        window.location.href = body.url
        return
      }
      if (body.sessionId) {
        // redirect to Stripe hosted checkout page
        window.location.href = `https://checkout.stripe.com/pay/${body.sessionId}`
        return
      }
      throw new Error('no checkout url returned')
    } catch (err: unknown) {
      console.error('checkout error', err)
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-display font-medium text-paper mb-2">Shopping Cart</h1>
            <p className="text-graphite">
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={`${item.id}-${item.variant?.size}-${item.variant?.color}`} className="border-graphite/20 bg-transparent">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-32 aspect-[4/5] overflow-hidden bg-mink/10 rounded-md">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-paper">{item.name}</h3>
                            {item.variant && (
                              <p className="text-sm text-graphite">
                                {item.variant.color} • Size {item.variant.size}
                              </p>
                            )}
                            {item.variant?.sku && (
                              <p className="text-xs text-graphite">SKU: {item.variant.sku}</p>
                            )}
                          </div>
                          <IconButton
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              removeFromCart(item.id, item.variant)
                              try { sonner('Removed from cart', { description: `${item.name} removed.` }) } catch (e) { console.debug('toast failed', e) }
                            }}
                            className="text-graphite hover:text-paper"
                          >
                            <X className="w-4 h-4" />
                          </IconButton>
                          
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <IconButton
                              variant="outline"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => updateQuantity(item.id, item.variant, Math.max(0, item.quantity - 1))}
                            >
                              <Minus className="w-3 h-3" />
                            </IconButton>
                            <span className="text-paper w-8 text-center">{item.quantity}</span>
                            <IconButton
                              variant="outline"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </IconButton>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium text-paper">${item.price * item.quantity}</p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-graphite">${item.price} each</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="border-graphite/20 bg-transparent">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-medium text-paper">Order Summary</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-graphite">Subtotal</span>
                      <span className="text-paper">${getTotalPrice()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-graphite">Shipping</span>
                      <span className="text-paper">
                        {shippingCost === 0 ? 'Free' : `$${shippingCost}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-graphite">Tax</span>
                      <span className="text-paper">${tax}</span>
                    </div>
                    
                    <Separator className="bg-graphite/20" />
                    
                    <div className="flex justify-between font-medium">
                      <span className="text-paper">Total</span>
                      <span className="text-paper">${finalTotal}</span>
                    </div>
                  </div>

                  {getTotalPrice() < 500 && (
                    <div className="p-3 bg-accent/10 rounded-md">
                      <p className="text-sm text-accent">
                        Add ${500 - getTotalPrice()} more for free shipping
                      </p>
                    </div>
                  )}

                  <Button className="w-full h-12" onClick={handleCheckout} disabled={loading}>
                    {loading ? 'Redirecting…' : 'Proceed to Checkout'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                </CardContent>
              </Card>

              {/* Shipping Info */}
              <Card className="border-graphite/20 bg-transparent">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-medium text-paper">Shipping Information</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                      <div>
                        <p className="text-paper font-medium">Standard Delivery</p>
                        <p className="text-graphite">5-7 business days • Free on orders $500+</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                      <div>
                        <p className="text-paper font-medium">Express Delivery</p>
                        <p className="text-graphite">2-3 business days • $35</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                      <div>
                        <p className="text-paper font-medium">Returns</p>
                        <p className="text-graphite">Free returns within 30 days</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Continue Shopping */}
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}