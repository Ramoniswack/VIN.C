import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cartStore'
import { toast as sonner } from '@/components/ui/sonner'

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const navigate = useNavigate()
  const clearCart = useCartStore(state => state.clear)

  useEffect(() => {
    if (!sessionId) {
      setStatus('missing')
      setLoading(false)
      return
    }
    const verify = async () => {
      try {
        const resp = await fetch(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`)
        const json = await resp.json()
        if (!resp.ok) throw new Error(json?.error || 'verify failed')
        setSession(json.session)
        const paymentStatus = json.session?.payment_status || json.session?.payment_intent?.status
        if (paymentStatus === 'paid' || paymentStatus === 'succeeded') {
          setStatus('paid')
          // clear local cart
          try { clearCart() } catch (e) { /* ignore */ }
          sonner('Payment successful! Your order is confirmed.', { description: 'Thanks — we emailed the receipt.' })
        } else {
          setStatus(paymentStatus || 'pending')
        }
      } catch (e: any) {
        setStatus('error')
        sonner('Payment verification failed', { description: e?.message ?? String(e) })
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [sessionId, clearCart])

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-display font-medium text-paper mb-4">Checkout</h1>
          {loading ? (
            <p className="text-graphite">Verifying payment…</p>
          ) : (
            <div className="space-y-4">
              {status === 'paid' ? (
                <>
                  <p className="text-paper text-lg">Payment received — thank you!</p>
                  <p className="text-graphite">We've emailed you the receipt. Order ID: <span className="font-mono">{session?.id}</span></p>
                  <Button onClick={() => navigate('/shop')}>Continue shopping</Button>
                </>
              ) : status === 'missing' ? (
                <p className="text-red-500">No session id provided.</p>
              ) : status === 'pending' ? (
                <p className="text-graphite">Payment is pending. If this doesn't update, contact support.</p>
              ) : status === 'error' ? (
                <p className="text-red-500">There was an error verifying your payment.</p>
              ) : (
                <p className="text-graphite">Status: {String(status)}</p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
