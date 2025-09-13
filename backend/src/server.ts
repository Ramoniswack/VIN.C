import express, { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import { PrismaClient } from '../generated/prisma'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

dotenv.config()

const app = express()
const port = process.env.PORT ?? 3000
const prisma = new PrismaClient()

// Stripe initialization (reads keys from environment)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY || ''
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-08-16' })

app.use(express.json())

// Extend Express Request to include optional `user` injected by requireAuth
declare global {
  namespace Express {
    interface Request {
      user?: { id?: string; email?: string; user_metadata?: Record<string, unknown> }
    }
  }
}

app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(products)
})

// GET product by id
app.get('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return res.status(404).json({ error: 'not found' })
  res.json(product)
})

// Upsert user profile (call after successful client login)
app.post('/api/users/upsert', async (req, res) => {
  const body = req.body ?? {}
  const { email, name, supabaseId, preferences } = body as any
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email required' })
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: name ?? undefined, supabaseId: supabaseId ?? undefined, preferences: preferences ?? undefined },
      create: { email, name: name ?? undefined, supabaseId: supabaseId ?? undefined, preferences: preferences ?? undefined }
    })
    return res.json({ ok: true, user })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

// Wishlist endpoints
app.get('/api/wishlist', requireAuth, async (req: Request, res: Response) => {
  const userEmail = req.user?.email
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail }, include: { wishlist: { include: { product: true } } } })
    if (!user) return res.json({ items: [] })
    return res.json({ items: user.wishlist.map(w => ({ id: w.id, product: w.product })) })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

app.post('/api/wishlist', requireAuth, async (req: Request, res: Response) => {
  const userEmail = req.user?.email
  const rawProductId = (req.body as any).productId
  const productId = typeof rawProductId === 'string' ? Number(rawProductId) : rawProductId
  if (!productId || Number.isNaN(Number(productId))) return res.status(400).json({ error: 'productId required' })
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) return res.status(404).json({ error: 'user not found' })
    const item = await prisma.wishlistItem.create({ data: { userId: user.id, productId } })
    return res.json({ ok: true, item })
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }
})

app.delete('/api/wishlist', requireAuth, async (req: Request, res: Response) => {
  const userEmail = req.user?.email
  const rawProductId = (req.body as any).productId
  const productId = typeof rawProductId === 'string' ? Number(rawProductId) : rawProductId
  if (!productId || Number.isNaN(Number(productId))) return res.status(400).json({ error: 'productId required' })
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) return res.status(404).json({ error: 'user not found' })
    await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

// Cart endpoints
app.get('/api/cart', requireAuth, async (req: Request, res: Response) => {
  const userEmail = req.user?.email
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail }, include: { cart: { include: { product: true } } } })
    if (!user) return res.json({ items: [] })
    return res.json({ items: user.cart.map(c => ({ id: c.id, product: c.product, quantity: c.quantity, variant: c.variant })) })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

app.post('/api/cart', requireAuth, async (req: Request, res: Response) => {
  const userEmail = req.user?.email
  const rawProductId = (req.body as any).productId
  const productId = typeof rawProductId === 'string' ? Number(rawProductId) : rawProductId
  const quantity = (req.body as any).quantity ?? 1
  const variant = (req.body as any).variant ?? null
  if (!productId || Number.isNaN(Number(productId))) return res.status(400).json({ error: 'productId required' })
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) return res.status(404).json({ error: 'user not found' })
    // upsert cart item by unique compound (userId, productId, variant)
    const existing = await prisma.cartItem.findUnique({ where: { userId_productId_variant: { userId: user.id, productId, variant: variant ?? null } } }).catch(() => null)
    if (existing) {
      const updated = await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } })
      return res.json({ ok: true, item: updated })
    }
    const item = await prisma.cartItem.create({ data: { userId: user.id, productId, quantity, variant } })
    return res.json({ ok: true, item })
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }
})

app.patch('/api/cart/:id', requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { quantity } = req.body as { quantity?: number }
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  try {
    const updated = await prisma.cartItem.update({ where: { id }, data: { quantity } })
    return res.json({ ok: true, item: updated })
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }
})

app.delete('/api/cart/:id', requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  try {
    await prisma.cartItem.delete({ where: { id } })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }
})

// Preferences
app.get('/api/users/me/preferences', requireAuth, async (req: Request, res: Response) => {
  const email = req.user?.email
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(404).json({ error: 'not found' })
  return res.json({ preferences: user.preferences })
})

app.post('/api/users/me/preferences', requireAuth, async (req: Request, res: Response) => {
  const email = req.user?.email
  const preferences = (req.body as any).preferences ?? undefined
  try {
    const updated = await prisma.user.update({ where: { email }, data: { preferences: preferences ?? undefined } as any })
    return res.json({ ok: true, preferences: updated.preferences })
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }
})

// Supabase auth middleware with dev fallback
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE) : null

async function requireAuth(req: any, res: any, next: any) {
  // Dev fallback can be explicitly enabled with DEV_AUTH_ENABLED=true.
  // When enabled and in non-production, an incoming request with X-ADMIN=1 will
  // bypass Supabase checks and set req.user from X-USER-EMAIL or DEV_USER_EMAIL.
  const devAuthEnabled = (process.env.DEV_AUTH_ENABLED === 'true')
  if (devAuthEnabled && (process.env.NODE_ENV !== 'production') && (req.headers['x-admin'] === '1')) {
    const devEmail = (req.headers['x-user-email'] as string) || process.env.DEV_USER_EMAIL || 'dev@example.com'
    req.user = { id: undefined, email: devEmail }
    return next()
  }

  // If Supabase is not configured at all, still allow the old fallback for local dev
  // (useful in some dev environments). This will be removed before production.
  if (!supabase) {
    const isAdmin = process.env.NODE_ENV !== 'production' || req.headers['x-admin'] === '1'
    if (!isAdmin) return res.status(403).json({ error: 'forbidden' })
    const devEmail = (req.headers['x-user-email'] as string) || process.env.DEV_USER_EMAIL || 'dev@example.com'
    req.user = { id: undefined, email: devEmail }
    return next()
  }

  const auth = req.headers.authorization as string | undefined
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' })
  const token = auth.slice(7)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return res.status(401).json({ error: 'invalid token' })

  // optional admin email check (comma-separated list in ADMIN_EMAILS)
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (adminEmails.length > 0) {
    const email = (data.user as any).email as string | undefined
    if (!email || !adminEmails.includes(email)) return res.status(403).json({ error: 'forbidden' })
  }

  req.user = data.user
  next()
}

// Create product
app.post('/api/products', requireAuth, async (req, res) => {
  const { title, slug, description, price, images = [], category, inStock = true } = req.body
  if (!title || !slug || typeof price !== 'number') return res.status(400).json({ error: 'missing fields' })
  const product = await prisma.product.create({ data: { title, slug, description, price, images, category, inStock } })
  res.status(201).json(product)
})

// Update product
app.patch('/api/products/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  const data: any = {}
  for (const k of ['title', 'slug', 'description', 'price', 'images', 'category', 'inStock']) {
    if (k in req.body) data[k] = (req.body as any)[k]
  }
  try {
    const updated = await prisma.product.update({ where: { id }, data })
    res.json(updated)
  } catch (e: any) {
    res.status(404).json({ error: 'not found' })
  }
})

// Delete product
app.delete('/api/products/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  try {
    await prisma.product.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e: any) {
    res.status(404).json({ error: 'not found' })
  }
})

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Create a Stripe Checkout session (client sends cart/items and success/cancel URLs)
app.post('/api/stripe/checkout', async (req: Request, res: Response) => {
  const { items, successUrl, cancelUrl, customerEmail } = req.body as any
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'items required' })
  try {
    const line_items = items.map((it: any) => ({ price_data: { currency: it.currency || 'usd', product_data: { name: it.name }, unit_amount: Number(it.unit_amount) }, quantity: Number(it.quantity || 1) }))
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:8080'}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:8080'}/cart`,
      customer_email: customerEmail || undefined
    })
    // Create an Order record (best-effort). amount_total is not available until payment, so approximate from line_items
    try {
      const amountTotal = line_items.reduce((s: number, li: any) => s + (li.price_data.unit_amount * li.quantity), 0)
      const order = await prisma.order.create({ data: { stripeSessionId: session.id, email: customerEmail ?? undefined, currency: line_items[0]?.price_data?.currency ?? 'usd', amountTotal, status: 'pending', items: { create: items.map((it: any) => ({ name: it.name, unitAmount: Number(it.unit_amount), quantity: Number(it.quantity || 1), productId: it.productId ?? undefined })) } } }).catch((e) => {
        console.warn('order create failed', e)
        return null
      })

    } catch (e) {
      // ignore order creation errors
      console.warn('order upsert error', e)
    }

    // return both id and hosted url when available so clients can redirect immediately
    return res.json({ ok: true, sessionId: session.id, url: (session.url as string) || null })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
})

// Verify a checkout session after redirect (fallback if you don't want webhooks yet)
app.get('/api/stripe/verify', async (req: Request, res: Response) => {
  const sessionId = (req.query.session_id as string) || (req.query.sessionId as string)
  if (!sessionId) return res.status(400).json({ error: 'session_id required' })
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })
    // If we have a matching Order, mark it paid when payment_status is paid
    try {
      const paymentStatus = (session as any).payment_status || (session as any).payment_intent?.status
      if (paymentStatus === 'paid' || paymentStatus === 'succeeded') {
        await prisma.order.updateMany({ where: { stripeSessionId: sessionId }, data: { status: 'paid' } }).catch(() => null)
      }
    } catch (err) { console.warn('order update failed', err) }
    return res.json({ ok: true, session })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
})

// Webhook handler - raw body is required for signature verification
// Note: we use a route-specific raw parser to avoid interfering with the JSON middleware above.
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = (req.headers['stripe-signature'] as string) || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret)
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed.', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  // Idempotency: persist event and skip if already processed
  try {
    const exists = await prisma.webhookEvent.findUnique({ where: { eventId: event.id } }).catch(() => null)
    if (exists) {
      console.log('duplicate webhook event, skipping', event.id)
      return res.json({ received: true })
    }
    await prisma.webhookEvent.create({ data: { eventId: event.id, type: event.type, payload: event } }).catch(() => null)
  } catch (e) {
    console.warn('webhook persistence warning', e)
  }

  // Handle event types you care about
  switch (event.type) {
    case 'checkout.session.completed': {
      // Handle the checkout.session.completed event
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Checkout session completed (webhook):', session.id)
      // Mark matching order as paid
      try {
        await prisma.order.updateMany({ where: { stripeSessionId: session.id }, data: { status: 'paid' } }).catch(() => null)
      } catch (e) {
        console.warn('order update from webhook failed', e)
      }
      break
    }
    case 'charge.refunded':
      console.log('Charge refunded:', event.id)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({ received: true })
})

// Admin emails endpoints (protected by service role or dev header)
function requireServiceRoleOrDev(req: Request, res: Response, next: NextFunction) {
  // allow local dev with header X-ADMIN-EDIT: 1
  if (process.env.NODE_ENV !== 'production' && (req.headers['x-admin-edit'] as string) === '1') return next()
  const key = (req.headers['x-service-role'] as string) || (req.headers['authorization'] as string) || ''
  const provided = key.replace(/^Bearer\s*/i, '')
  if (!provided || provided !== (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE)) return res.status(401).json({ error: 'unauthorized' })
  return next()
}

// Require that the request comes from an authenticated supabase user who is also an admin
async function requireAdmin(req: any, res: any, next: any) {
  if (!supabase) return res.status(403).json({ error: 'forbidden' })
  const auth = (req.headers.authorization as string) || ''
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' })
  const token = auth.replace(/^Bearer\s*/i, '')
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return res.status(401).json({ error: 'invalid token' })
  const email = (data.user as any).email as string | undefined
  if (!email) return res.status(401).json({ error: 'invalid user' })
  const admin = await prisma.admin.findUnique({ where: { email } })
  if (!admin) return res.status(403).json({ error: 'forbidden' })
  req.user = data.user
  return next()
}

app.get('/api/admin/emails', async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({ select: { email: true } })
    return res.json({ emails: admins.map(a => a.email) })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

app.post('/api/admin/emails', requireServiceRoleOrDev, async (req, res) => {
  const { email } = req.body
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email required' })
  try {
    const admin = await prisma.admin.create({ data: { email } })
    return res.json({ ok: true, admin })
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }
})

app.delete('/api/admin/emails', requireServiceRoleOrDev, async (req, res) => {
  const { email } = req.body
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email required' })
  try {
    await prisma.admin.deleteMany({ where: { email } })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
})

// Admin user management
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    // annotate with isAdmin by checking Admin table
    const adminEmails = (await prisma.admin.findMany({ select: { email: true } })).map(a => a.email)
    const annotated = users.map(u => ({ ...u, isAdmin: adminEmails.includes(u.email) }))
    return res.json({ users: annotated })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

// Promote a user to admin (creates an Admin record)
app.post('/api/admin/users/:id/make-admin', requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return res.status(404).json({ error: 'user not found' })
    const admin = await prisma.admin.upsert({ where: { email: user.email }, update: {}, create: { email: user.email } })
    return res.json({ ok: true, admin })
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }
})

// Revoke admin privileges for a user (delete Admin record)
app.post('/api/admin/users/:id/revoke-admin', requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return res.status(404).json({ error: 'user not found' })
    await prisma.admin.deleteMany({ where: { email: user.email } })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }
})

// Admin orders & stats endpoint
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const totalRevenueRow = await prisma.order.aggregate({ _sum: { amountTotal: true } }).catch(() => null)
    const totalRevenue = totalRevenueRow?._sum?.amountTotal ?? 0
    const totalOrders = await prisma.order.count().catch(() => 0)
    const recent = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
    return res.json({ ok: true, stats: { totalRevenue, totalOrders }, recent })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
