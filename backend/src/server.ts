import express, { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import { PrismaClient } from '../generated/prisma'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import path from 'path'
import fs from 'fs'
import multer from 'multer'

dotenv.config()

const app = express()
const port = process.env.PORT ?? 3000
const prisma = new PrismaClient()

// Helper: find user by email case-insensitively and optionally include relations
async function findUserByEmailInsensitive(email?: string, include?: any) {
  if (!email) return null
  try {
    return await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, include })
  } catch (e) {
    return null
  }
}

// helper: award points to a user by email and update preferences.level
async function awardPointsToEmail(email?: string, pts?: number) {
  try {
    if (!email || !pts || Number.isNaN(Number(pts))) return
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, preferences: true } })
    if (!user) return
    const prefs = (user.preferences as any) || {}
    const current = Number(prefs.points || 0)
    const next = current + Number(pts)
    let level = Number(prefs.level || 1)
    if (next >= 100) level = 4
    else if (next >= 50) level = 3
    else if (next >= 20) level = 2
    else level = 1
    await prisma.user.update({ where: { id: user.id }, data: { preferences: { ...(prefs || {}), points: next, level } } as any })
  } catch (e) {
    console.warn('awardPointsToEmail failed', e)
  }
}

// Stripe initialization (reads keys from environment). Only initialize if a key is present.
// Accept a few common environment variable names for the Stripe secret so users
// who put the key under a different name (e.g. STRIPE_API_KEY or VITE_STRIPE_SECRET_KEY)
// will still have it detected. We only log the env var name (not its value).
const stripeEnvNames = ['STRIPE_SECRET_KEY', 'STRIPE_KEY', 'STRIPE_API_KEY', 'STRIPE_SECRET', 'VITE_STRIPE_SECRET_KEY']
let foundStripeEnvName = ''
for (const n of stripeEnvNames) {
  if (process.env[n] && String(process.env[n]).trim() !== '') {
    foundStripeEnvName = n
    break
  }
}
const STRIPE_SECRET_KEY = foundStripeEnvName ? String(process.env[foundStripeEnvName]) : ''
console.log('Stripe secret present:', Boolean(STRIPE_SECRET_KEY), foundStripeEnvName ? `(via ${foundStripeEnvName})` : '')
let stripe: Stripe | null = null
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY)
} else {
  console.warn('Stripe not configured - stripe endpoints will return 503 until STRIPE_SECRET_KEY is set')
}

app.use(express.json())

// Ensure public/Products exists for saved images
const productsDir = path.resolve(__dirname, '..', '..', 'public', 'Products')
try { fs.mkdirSync(productsDir, { recursive: true }) } catch (e) { /* ignore */ }

// Preserve the exact product name for filenames but guard against path separators
function filenameSafe(name: string) {
  return name.replace(/[\/\0]/g, '_').trim()
}

// Slugify helper for URLs / DB slugs (lowercase, alnum and dashes)
function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// multer setup for single file upload (main image) and multiple additional images
const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

// Extend Express Request to include optional `user` injected by requireAuth
declare global {
  namespace Express {
    interface Request {
      user?: { id?: string; email?: string; user_metadata?: Record<string, unknown> }
    }
  }
}

// Products listing with pagination support
app.get('/api/products', async (req, res) => {
  // page and pageSize are optional query params - default page=1, pageSize=9
  const page = Math.max(1, Number(req.query.page || 1))
  const pageSize = Math.max(1, Number(req.query.pageSize || 9))
  try {
    const total = await prisma.product.count()
    const items = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
    return res.json({ items, total, page, pageSize })
  } catch (e) {
    console.error('products list error', e)
    return res.status(500).json({ error: 'server error' })
  }
})

// Server-side search endpoint (case-insensitive, matches title, description, category, or slug)
app.get('/api/products/search', async (req, res) => {
  const q = (req.query.q as string) || ''
  if (!q || typeof q !== 'string' || q.trim().length === 0) return res.json({ items: [], total: 0, page: 1, pageSize: 9 })
  const term = q.trim()
  const page = Math.max(1, Number(req.query.page || 1))
  const pageSize = Math.max(1, Number(req.query.pageSize || 9))
  try {
    const where: any = {
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } }
      ]
    }
    const total = await prisma.product.count({ where }).catch(() => 0)
    const items = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
    return res.json({ items, total, page, pageSize })
  } catch (e) {
    console.error('search error', e)
    return res.status(500).json({ error: 'search failed' })
  }
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
    // normalize email to lowercase for storage/lookup consistency
    const normalizedEmail = String(email).trim().toLowerCase()
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: { name: name ?? undefined, supabaseId: supabaseId ?? undefined, preferences: preferences ?? undefined },
      create: { email: normalizedEmail, name: name ?? undefined, supabaseId: supabaseId ?? undefined, preferences: preferences ?? undefined }
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
    const user = await findUserByEmailInsensitive(userEmail, { wishlist: { include: { product: true } } })
    if (!user) return res.json({ items: [] })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = user.wishlist.map(w => ({ id: w.id, product: (w as any).product ?? null, createdAt: w.createdAt }))
    return res.json({ items, count: items.length })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

app.post('/api/wishlist', requireAuth, async (req: Request, res: Response) => {
  const userEmail = req.user?.email
  console.debug('/api/wishlist POST called - headers:', { 'x-user-email': req.headers['x-user-email'], authorization: req.headers.authorization })
  console.debug('/api/wishlist POST called - req.user:', req.user)
  console.debug('/api/wishlist POST called - body:', req.body)
  const rawProductId = (req.body as any).productId
  const productId = typeof rawProductId === 'string' ? Number(rawProductId) : rawProductId
  if (!productId || Number.isNaN(Number(productId))) return res.status(400).json({ error: 'productId required' })
  try {
    const user = await findUserByEmailInsensitive(userEmail)
    if (!user) return res.status(404).json({ error: 'user not found' })
    const item = await prisma.wishlistItem.create({ data: { userId: user.id, productId } })
    // award points for adding to wishlist
    try { await awardPointsToEmail(userEmail, 5) } catch (e) { /* ignore */ }
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
    const user = await findUserByEmailInsensitive(userEmail)
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
    const user = await findUserByEmailInsensitive(userEmail, { cart: { include: { product: true } } })
    if (!user) return res.json({ items: [], totalItems: 0, totalCents: 0 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = user.cart.map(c => ({ id: c.id, product: (c as any).product ?? null, quantity: (c as any).quantity ?? 0, variant: (c as any).variant ?? null, createdAt: c.createdAt }))
    // compute totals in cents
    const totalItems = items.reduce((s: number, it: any) => s + (Number(it.quantity || 0)), 0)
    const totalCents = items.reduce((s: number, it: any) => s + ((it.product?.price || 0) * (it.quantity || 0)), 0)
    return res.json({ items, totalItems, totalCents })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

app.post('/api/cart', requireAuth, async (req: Request, res: Response) => {
  const userEmail = req.user?.email
  console.debug('/api/cart POST called - headers:', { 'x-user-email': req.headers['x-user-email'], authorization: req.headers.authorization })
  console.debug('/api/cart POST called - req.user:', req.user)
  console.debug('/api/cart POST called - body:', req.body)
  const rawProductId = (req.body as any).productId
  const productId = typeof rawProductId === 'string' ? Number(rawProductId) : rawProductId
  const quantity = (req.body as any).quantity ?? 1
  let variant: any = (req.body as any).variant ?? null
  // normalize variant to a stable string when it's an object so unique constraints match
  try { if (variant !== null && typeof variant !== 'string') variant = JSON.stringify(variant) } catch (e) { variant = String(variant) }
  console.debug('/api/cart POST incoming', { userEmail: req.user?.email, productId, quantity, variant })
  if (!productId || Number.isNaN(Number(productId))) return res.status(400).json({ error: 'productId required' })
  try {
    const user = await findUserByEmailInsensitive(userEmail)
    if (!user) return res.status(404).json({ error: 'user not found' })
    // upsert cart item by unique compound (userId, productId, variant)
    const existing = await prisma.cartItem.findUnique({ where: { userId_productId_variant: { userId: user.id, productId, variant: variant ?? null } } }).catch(() => null)
    if (existing) {
      const updated = await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } })
      // award points for adding items to cart (increment)
      try { await awardPointsToEmail(userEmail, 5) } catch (e) { /* ignore */ }
      return res.json({ ok: true, item: updated })
    }
    const item = await prisma.cartItem.create({ data: { userId: user.id, productId, quantity, variant } })
    // award points for new cart item
    try { await awardPointsToEmail(userEmail, 5) } catch (e) { /* ignore */ }
    return res.json({ ok: true, item })
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }
})

// Delete cart items by productId (and optional variant) for the authenticated user
app.delete('/api/cart', requireAuth, async (req: Request, res: Response) => {
  const userEmail = req.user?.email
  const rawProductId = (req.body as any).productId
  const productId = typeof rawProductId === 'string' ? Number(rawProductId) : rawProductId
  let variant: any = (req.body as any).variant ?? undefined
  try { if (variant !== undefined && variant !== null && typeof variant !== 'string') variant = JSON.stringify(variant) } catch (e) { variant = String(variant) }
  console.debug('/api/cart DELETE incoming', { userEmail, productId, variant })
  if (!productId || Number.isNaN(Number(productId))) return res.status(400).json({ error: 'productId required' })
  try {
    const user = await findUserByEmailInsensitive(userEmail)
    if (!user) return res.status(404).json({ error: 'user not found' })
    const where: any = { userId: user.id, productId }
    // if variant specified, delete only matching variant, otherwise delete all variants for product
    if (variant !== undefined) where.variant = variant
    await prisma.cartItem.deleteMany({ where })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
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

// User orders (for dashboard / recent activity)
app.get('/api/users/me/orders', requireAuth, async (req: Request, res: Response) => {
  const email = req.user?.email
  try {
    const user = await findUserByEmailInsensitive(email)
    if (!user) return res.status(404).json({ orders: [] })
    const orders = await prisma.order.findMany({ where: { userId: user.id }, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 10 })
    return res.json({ orders })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

// User progress (stored in user.preferences to avoid schema migration)
app.get('/api/users/me/progress', requireAuth, async (req: Request, res: Response) => {
  const email = req.user?.email
  try {
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, preferences: true } })
    if (!user) return res.status(404).json({ points: 0, level: 1 })
    const prefs = (user.preferences as any) || {}
    const points = Number(prefs.points || 0)
    const level = Number(prefs.level || 1)
    return res.json({ points, level })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

// Award points to the user (incremental). Body: { points: number }
app.post('/api/users/me/progress/award', requireAuth, async (req: Request, res: Response) => {
  const email = req.user?.email
  const pts = Number((req.body as any).points || 0)
  if (!pts || Number.isNaN(pts)) return res.status(400).json({ error: 'points required' })
  try {
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, preferences: true } })
    if (!user) return res.status(404).json({ error: 'user not found' })
    const prefs = (user.preferences as any) || {}
    const current = Number(prefs.points || 0)
    const next = current + pts
    // compute level by simple thresholds: level 1:0-19, level2:20-49, level3:50-99, level4:100+
    let level = Number(prefs.level || 1)
    if (next >= 100) level = 4
    else if (next >= 50) level = 3
    else if (next >= 20) level = 2
    else level = 1
    const updated = await prisma.user.update({ where: { id: user.id }, data: { preferences: { ...(prefs || {}), points: next, level } } as any })
    return res.json({ points: next, level })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
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
  // Allow dev bypass via X-ADMIN when running in non-production. Previously this
  // required DEV_AUTH_ENABLED=true; relax it so local devs using X-ADMIN are not
  // blocked. This still blocks in production.
  // Support EventSource which cannot set custom headers by allowing x-admin
  // and x-user-email to be passed as query params in non-production or when
  // DEV_AUTH_ENABLED=true.
  const qpXAdmin = (req.query && (req.query.x_admin || req.query['x-admin'])) as any
  const qpUserEmail = (req.query && (req.query.x_user_email || req.query['x-user-email'])) as any
  // Only allow dev header bypass when explicitly enabled via DEV_AUTH_ENABLED='true'
  if (process.env.DEV_AUTH_ENABLED === 'true' && (((req.headers['x-admin'] as string) === '1' || (req.headers['x-admin'] as any) === 1) || qpXAdmin === '1' || qpXAdmin === 1)) {
    const devEmail = (req.headers['x-user-email'] as string) || qpUserEmail || process.env.DEV_USER_EMAIL || 'dev@example.com'
    req.user = { id: undefined, email: devEmail }
    return next()
  }

  // If Supabase is not configured at all, still allow the old fallback for local dev
  // (useful in some dev environments). This will be removed before production.
  if (!supabase) {
    // If Supabase isn't configured, only allow header-based auth when
    // DEV_AUTH_ENABLED is explicitly 'true'. This prevents accidental mapping
    // of all local requests to a dev user when running in development.
    const headerEmail = (req.headers['x-user-email'] as string) || process.env.DEV_USER_EMAIL || ''
    if (headerEmail && process.env.DEV_AUTH_ENABLED === 'true') {
      req.user = { id: undefined, email: headerEmail }
      return next()
    }
    // Fallback: if no user email provided, only allow explicit dev-admin via X-ADMIN
    const isAdmin = process.env.DEV_AUTH_ENABLED === 'true' && ((req.headers['x-admin'] === '1') || qpXAdmin === '1' || qpXAdmin === 1)
    if (isAdmin) {
      const devEmail = (req.headers['x-user-email'] as string) || qpUserEmail || process.env.DEV_USER_EMAIL || 'dev@example.com'
      req.user = { id: undefined, email: devEmail }
      return next()
    }
    return res.status(403).json({ error: 'forbidden' })
  }

  const auth = req.headers.authorization as string | undefined
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' })
  const token = auth.slice(7)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return res.status(401).json({ error: 'invalid token' })

  // Authenticated via Supabase - attach user to request and continue.
  req.user = data.user
  next()
}

// Create product
app.post('/api/products', requireAuth, async (req, res) => {
  const { title, slug, description, price, images = [], category, inStock = true, colors = [], sizes = [] } = req.body
  if (!title || !slug || typeof price !== 'number') return res.status(400).json({ error: 'missing fields' })
  const product = await prisma.product.create({ data: { title, slug, description, price, images, category, inStock, colors: Array.isArray(colors) ? colors : [], sizes: Array.isArray(sizes) ? sizes : [] } })
  res.status(201).json(product)
})

// Create product with image upload
app.post('/api/products-with-image', requireAdmin, upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'additionalImages', maxCount: 5 }]), async (req: any, res: any) => {
  try {
    const body = req.body || {}
    const title = body.name || body.title
    const price = Number(body.price)
    const description = body.description || ''
    const category = body.category || 'Shirts'
    const inStock = body.inStock === undefined ? true : (body.inStock === 'true' || body.inStock === true)

    if (!title || Number.isNaN(price)) return res.status(400).json({ error: 'missing fields' })
    // enforce uniqueness by slug (prevent duplicate product names)
    const slug = slugify(String(title))
    const exists = await prisma.product.findUnique({ where: { slug } }).catch(() => null)
    if (exists) return res.status(409).json({ error: 'product with the same name already exists' })

    // determine filename from title (preserve product name, but replace path separators)
    const mainFile = req.files && req.files.mainImage && req.files.mainImage[0]
    let imagePath = '/Products/placeholder.jpg'
    if (mainFile) {
      const ext = path.extname(mainFile.originalname) || '.jpg'
      const baseName = filenameSafe(String(title))
      const filename = `${baseName}${ext}`
      const outPath = path.join(productsDir, filename)
      // write buffer to disk (overwrite if exists)
      fs.writeFileSync(outPath, mainFile.buffer)
      imagePath = `/Products/${filename}`
    }

    // handle additional images if present
    const additionalFiles = req.files && req.files.additionalImages ? req.files.additionalImages : []
    const additionalPaths: string[] = []
    if (additionalFiles && additionalFiles.length) {
      for (let i = 0; i < additionalFiles.length; i++) {
        const f = additionalFiles[i]
        const ext = path.extname(f.originalname) || '.jpg'
        const baseName = filenameSafe(String(title))
        const filename = `${baseName}__add__${i + 1}${ext}`
        const outPath = path.join(productsDir, filename)
        fs.writeFileSync(outPath, f.buffer)
        additionalPaths.push(`/Products/${filename}`)
      }
    }

    // save product with image path and any additional image urls
    const allImages = [imagePath, ...additionalPaths].filter(Boolean)
  // accept optional colors/sizes from form body (may be JSON-encoded strings)
  const rawColors = body.colors || []
  const rawSizes = body.sizes || []
  const colors = typeof rawColors === 'string' ? JSON.parse(rawColors) : rawColors
  const sizes = typeof rawSizes === 'string' ? JSON.parse(rawSizes) : rawSizes
  const product = await prisma.product.create({ data: { title, slug, description, price: Math.round(price), images: allImages, category, inStock, colors: Array.isArray(colors) ? colors : [], sizes: Array.isArray(sizes) ? sizes : [] } })
    return res.status(201).json(product)
  } catch (e) {
    console.error('product upload error', e)
    return res.status(500).json({ error: 'server error' })
  }
})

// Update product
app.patch('/api/products/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  const data: any = {}
  const body = req.body || {}
  // accept 'name' (frontend) as alias for 'title' (db)
  if ('name' in body) data.title = body.name
  for (const k of ['title', 'slug', 'description', 'price', 'images', 'category', 'inStock', 'colors', 'sizes']) {
    if (k in body) data[k] = (body as any)[k]
  }

  // coerce numeric price if sent as string
  if (data.price && typeof data.price === 'string') data.price = Number(data.price)

  // If colors/sizes were sent as JSON strings, coerce them to arrays
  if ('colors' in data && typeof data.colors === 'string') {
    try { data.colors = JSON.parse(data.colors) } catch (e) { data.colors = [] }
  }
  if ('sizes' in data && typeof data.sizes === 'string') {
    try { data.sizes = JSON.parse(data.sizes) } catch (e) { data.sizes = [] }
  }

  try {
    // ensure product exists first for clearer errors
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'not found' })
    const updated = await prisma.product.update({ where: { id }, data })
    res.json(updated)
  } catch (e: any) {
    console.error('product update error', e)
    // return the actual error message to help debugging in dev; avoid leaking in prod
    return res.status(400).json({ error: e?.message || String(e) })
  }
})

// Update product with optional image upload
app.patch('/api/products/:id/with-image', requireAdmin, upload.fields([{ name: 'mainImage', maxCount: 1 }]), async (req: any, res: any) => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
    const body = req.body || {}
    const data: any = {}
    for (const k of ['name', 'description', 'price', 'category', 'inStock', 'material', 'care', 'sku', 'colors', 'sizes']) {
      if (k in body) data[k] = body[k]
    }

    const mainFile = req.files && req.files.mainImage && req.files.mainImage[0]
    if (mainFile) {
      const title = body.name || data.name || 'product'
      const ext = path.extname(mainFile.originalname) || '.jpg'
      const baseName = filenameSafe(String(title))
      const filename = `${baseName}${ext}`
      const outPath = path.join(productsDir, filename)
      fs.writeFileSync(outPath, mainFile.buffer)
      data.images = [`/Products/${filename}`]
    }

    // If colors/sizes were sent as JSON-encoded strings in multipart form, coerce them
    if ('colors' in data && typeof data.colors === 'string') {
      try { data.colors = JSON.parse(data.colors) } catch (e) { data.colors = [] }
    }
    if ('sizes' in data && typeof data.sizes === 'string') {
      try { data.sizes = JSON.parse(data.sizes) } catch (e) { data.sizes = [] }
    }

    const updated = await prisma.product.update({ where: { id }, data })
    return res.json(updated)
  } catch (e) {
    console.error('product update with image error', e)
    return res.status(500).json({ error: 'server error' })
  }
})

// Delete product
app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  try {
    // find product first to remove any files
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return res.status(404).json({ error: 'not found' })
    // delete image files under public/Products
    try {
      const imgs: string[] = Array.isArray(product.images) ? product.images : []
      for (const img of imgs) {
        if (!img) continue
        // only handle local /Products/ files
        if (img.startsWith('/Products/')) {
          const filePath = path.join(__dirname, '..', '..', 'public', img.replace(/^\//, ''))
          try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath) } catch (e) { console.warn('failed to remove file', filePath, e) }
        }
      }
    } catch (e) {
      console.warn('error deleting product files', e)
    }

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
  if (!stripe) return res.status(503).json({ error: 'stripe not configured' })
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
      const order = await prisma.order.create({
        data: {
          stripeSessionId: session.id,
          email: customerEmail ?? undefined,
          currency: line_items[0]?.price_data?.currency ?? 'usd',
          amountTotal,
          status: 'pending',
          items: { create: items.map((it: any) => ({ name: it.name, unitAmount: Number(it.unit_amount), quantity: Number(it.quantity || 1), productId: it.productId ?? undefined })) }
        }
      }).catch((e) => {
        console.warn('order create failed', e)
        return null
      })
      // broadcast new order to SSE clients (if any)
      if (order) {
        try { broadcastOrdersEvent('order.created', order) } catch (e) { console.warn('broadcast order.created failed', e) }
      }

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
  if (!stripe) return res.status(503).json({ error: 'stripe not configured' })
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
    if (!stripe) return res.status(503).json({ error: 'stripe not configured' })
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
  // Persist a JSON-serializable copy of the event payload
  await prisma.webhookEvent.create({ data: { eventId: event.id, type: event.type, payload: JSON.parse(JSON.stringify(event)) } }).catch(() => null)
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
        // broadcast order paid
        try {
          const order = await prisma.order.findFirst({ where: { stripeSessionId: session.id } }).catch(() => null)
          if (order) {
            broadcastOrdersEvent('order.paid', order)
            // award points for completed order
            try { await awardPointsToEmail(order.email || undefined, 10) } catch (e) { /* ignore */ }
          }
        } catch (e) { console.warn('broadcast order.paid failed', e) }
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
  // allow explicit local dev with header X-ADMIN-EDIT: 1 only when DEV_AUTH_ENABLED is true
  if (process.env.DEV_AUTH_ENABLED === 'true' && (req.headers['x-admin-edit'] as string) === '1') return next()
  const key = (req.headers['x-service-role'] as string) || (req.headers['authorization'] as string) || ''
  const provided = key.replace(/^Bearer\s*/i, '')
  if (!provided || provided !== (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE)) return res.status(401).json({ error: 'unauthorized' })
  return next()
}

// Require that the request comes from an authenticated supabase user who is also an admin
async function requireAdmin(req: any, res: any, next: any) {
  // dev bypass: allow X-ADMIN header or x-admin query param in non-production for local testing
  const qpXAdmin2 = (req.query && (req.query.x_admin || req.query['x-admin'])) as any
  const qpUserEmail2 = (req.query && (req.query.x_user_email || req.query['x-user-email'])) as any
  // Only allow dev bypass for admin when DEV_AUTH_ENABLED === 'true'
  if (process.env.DEV_AUTH_ENABLED === 'true' && ((req.headers['x-admin'] === '1') || qpXAdmin2 === '1' || qpXAdmin2 === 1)) {
    const devEmail = (req.headers['x-user-email'] as string) || qpUserEmail2 || process.env.DEV_USER_EMAIL || 'dev@example.com'
    req.user = { email: devEmail }
    return next()
  }
  // If Supabase is not configured, allow admin by dev header or by matching
  // X-USER-EMAIL against ADMIN_EMAILS env var. This keeps local dev usable
  // when Supabase is not set up.
  if (!supabase) {
    // explicit dev bypass
    if (process.env.DEV_AUTH_ENABLED === 'true' && ((req.headers['x-admin'] === '1') || qpXAdmin2 === '1' || qpXAdmin2 === 1)) {
      const devEmail = (req.headers['x-user-email'] as string) || qpUserEmail2 || process.env.DEV_USER_EMAIL || 'dev@example.com'
      req.user = { email: devEmail }
      return next()
    }
    // allow by X-USER-EMAIL matching ADMIN_EMAILS
    const envAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    const headerEmail = (req.headers['x-user-email'] as string) || ''
    if (headerEmail && envAdmins.includes(headerEmail.toLowerCase())) {
      req.user = { email: headerEmail }
      return next()
    }
    return res.status(403).json({ error: 'forbidden' })
  }
  const auth = (req.headers.authorization as string) || ''
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' })
  const token = auth.replace(/^Bearer\s*/i, '')
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return res.status(401).json({ error: 'invalid token' })
  const email = (data.user as any).email as string | undefined
  if (!email) return res.status(401).json({ error: 'invalid user' })
  // allow admins listed in DB or in ADMIN_EMAILS env var (comma-separated)
  const admin = await prisma.admin.findUnique({ where: { email } })
  const envAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (!admin && !(email.toLowerCase && envAdmins.includes(email.toLowerCase()))) return res.status(403).json({ error: 'forbidden' })
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
    const productsCount = await prisma.product.count().catch(() => 0)
    const customersCount = await prisma.user.count().catch(() => 0)
    const recent = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })

    // compute top selling products by aggregating OrderItem rows
    const items = await prisma.orderItem.findMany({ where: {}, select: { productId: true, name: true, unitAmount: true, quantity: true } }).catch(() => [])
    const agg: Record<string, { productId?: number | null; name: string; units: number; revenue: number }> = {}
    for (const it of items as any[]) {
      const key = String(it.productId ?? it.name)
      if (!agg[key]) agg[key] = { productId: it.productId, name: it.name || 'Unknown', units: 0, revenue: 0 }
      agg[key].units += Number(it.quantity || 0)
      agg[key].revenue += Number(it.unitAmount || 0) * Number(it.quantity || 0)
    }
    const topSelling = Object.values(agg).sort((a, b) => b.units - a.units).slice(0, 10)

    // try to enrich with product category if productId is present
    for (const p of topSelling) {
      if (p.productId) {
        try {
          const prod = await prisma.product.findUnique({ where: { id: Number(p.productId) } })
          if (prod) p.name = prod.title || p.name
          // optional category field
          ;(p as any).category = prod?.category || null
        } catch (e) { /* ignore */ }
      }
    }

    return res.json({ ok: true, stats: { totalRevenue, totalOrders, productsCount, customersCount }, recent, topSelling })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

// Debug endpoint: per-user wishlist/cart counts and cart total (cents)
app.get('/api/admin/debug/user-stats', requireServiceRoleOrDev, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true } })
    const out: Array<any> = []
    for (const u of users) {
      const wishlistCount = await prisma.wishlistItem.count({ where: { userId: u.id } }).catch(() => 0)
      const cartItems = await prisma.cartItem.findMany({ where: { userId: u.id }, include: { product: true } }).catch(() => [])
      const cartCount = (cartItems || []).length
      const cartTotal = (cartItems || []).reduce((s: number, it: any) => s + ((it.product?.price || 0) * (it.quantity || 0)), 0)
      out.push({ email: u.email, wishlistCount, cartCount, cartTotal })
    }
    return res.json({ users: out })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

// Debug: return detailed cart and wishlist items for users who have any
app.get('/api/admin/debug/user-details', requireServiceRoleOrDev, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true } })
    const out: any[] = []
    for (const u of users) {
      const wishlist = await prisma.wishlistItem.findMany({ where: { userId: u.id }, include: { product: true } }).catch(() => [])
      const cart = await prisma.cartItem.findMany({ where: { userId: u.id }, include: { product: true } }).catch(() => [])
      if ((wishlist && wishlist.length) || (cart && cart.length)) {
        out.push({ email: u.email, wishlist: wishlist.map(w => ({ id: w.id, productId: w.productId, title: w.product?.title, price: w.product?.price, createdAt: w.createdAt })), cart: cart.map(c => ({ id: c.id, productId: c.productId, title: c.product?.title, price: c.product?.price, quantity: c.quantity, createdAt: c.createdAt })) })
      }
    }
    return res.json({ users: out })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

// Simple SSE (Server-Sent Events) implementation for realtime order updates
const sseClients: Array<{ id: string; res: Response }> = []
function broadcastOrdersEvent(event: string, data: any) {
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`
  for (const client of sseClients) {
    try { client.res.write(payload) } catch (e) { /* ignore per-client errors */ }
  }
}

app.get('/api/admin/orders/stream', requireAdmin, async (req: Request, res: Response) => {
  // set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders && res.flushHeaders()
  const id = Math.random().toString(36).slice(2)
  sseClients.push({ id, res })
  req.on('close', () => {
    const idx = sseClients.findIndex(c => c.id === id)
    if (idx >= 0) sseClients.splice(idx, 1)
  })
})

// Admin: list orders with pagination
app.get('/api/admin/orders/list', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1))
    const pageSize = Math.max(1, Number(req.query.pageSize || 20))
    const total = await prisma.order.count()
    const items = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { items: true } })
    return res.json({ ok: true, items, total, page, pageSize })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

// Admin: get order detail
app.get('/api/admin/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  try {
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
    if (!order) return res.status(404).json({ error: 'not found' })
    return res.json({ ok: true, order })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
})

// Admin: update order status (e.g., mark shipped/refunded)
app.patch('/api/admin/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' })
  const { status } = req.body as any
  if (!status) return res.status(400).json({ error: 'status required' })
  try {
    const updated = await prisma.order.update({ where: { id }, data: { status } as any })
    // broadcast update
    try { broadcastOrdersEvent('order.updated', updated) } catch (e) { console.warn('broadcast order.updated failed', e) }
    return res.json({ ok: true, order: updated })
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
