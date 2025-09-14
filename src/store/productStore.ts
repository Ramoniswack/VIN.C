import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type ProductColor = 'Black' | 'White' | 'Navy' | 'Camel' | 'Olive' | 'Grey' | 'Red' | 'Blue' | 'Brown';
export type ProductCategory = 'Blazers' | 'Trousers' | 'Shirts' | 'Outerwear' | 'Accessories' | 'Sets';

export interface Product {
  id: number;
  name: string;
  price: number;
  compareAt?: number;
  description?: string;
  image: string;
  additionalImages: string[];
  colors: ProductColor[];
  sizes: ProductSize[];
  inStock: boolean;
  isNew: boolean;
  isFeatured: boolean;
  category: ProductCategory;
  material?: string;
  care?: string;
  sku?: string;
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImageFile {
  url: string;
  file?: File;
  name: string;
  size: number;
  type: string;
}

interface ProductStore {
  products: Product[];
  lastGeneratedId: number;
  // pagination
  visibleCount: number;
  pageSize: number;
  // pagination metadata from server
  total?: number;
  page: number;
  loadMore: () => void;
  resetPagination: () => void;
  // admin overrides persisted locally when server doesn't store flags
  adminOverrides: Record<number, { isNew?: boolean }>;
  setAdminOverride: (id: number, data: { isNew?: boolean }) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviews'>) => Product;
  updateProduct: (id: number, product: Partial<Product>) => Promise<Product | undefined>;
  deleteProduct: (id: number) => Promise<void>;
  getProduct: (id: number) => Product | undefined;
  generateImageUrl: (file: File) => string;
  loadProducts: (page?: number, pageSize?: number) => Promise<void>;
}

// Initial product data
const initialProducts: Product[] = [
  {
    id: 1,
    name: "White Jacket",
    price: 1200,
    compareAt: 1500,
    description: "Elegant white jacket with premium cotton blend. Perfect for formal and semi-formal occasions.",
    image: "/Products/WhiteJack.jpg",
    additionalImages: ["/Products/WhiteJack2.jpg"],
    colors: ["White", "Camel"],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    isNew: false,
    isFeatured: true,
    category: "Outerwear",
    material: "80% Cotton, 20% Polyester",
    care: "Dry clean only",
    sku: "WJ-001",
    rating: 4.8,
    reviews: 24,
    createdAt: "2025-06-15T14:30:00Z",
    updatedAt: "2025-06-15T14:30:00Z"
  },
  {
    id: 2,
    name: "Mocca Shirt",
    price: 650,
    description: "Premium mocca shirt made with the finest Egyptian cotton.",
    image: "/Products/MoccaShirt.jpg",
    additionalImages: ["/Products/MoccaShirt2.jpg"],
    colors: ["Camel", "White"],
    sizes: ["XS", "S", "M", "L"],
    inStock: true,
    isNew: true,
    isFeatured: false,
    category: "Shirts",
    material: "100% Egyptian Cotton",
    care: "Machine wash cold, tumble dry low",
    sku: "MS-002",
    rating: 4.9,
    reviews: 18,
    createdAt: "2025-07-20T09:15:00Z",
    updatedAt: "2025-07-20T09:15:00Z"
  },
  {
    id: 3,
    name: "Regal Chinos",
    price: 850,
    compareAt: 950,
    description: "Elegant chinos with perfect fit and comfort for all-day wear.",
    image: "/Products/RegalChinos.jpg",
    additionalImages: ["/Products/RegalChinos2.jpg"],
    colors: ["Navy", "Camel", "Black"],
    sizes: ["S", "M", "L", "XL"],
    inStock: false,
    isNew: false,
    isFeatured: true,
    category: "Trousers",
    material: "98% Cotton, 2% Elastane",
    care: "Machine wash cold",
    sku: "RC-003",
    rating: 4.7,
    reviews: 31,
    createdAt: "2025-05-10T11:45:00Z",
    updatedAt: "2025-08-05T16:30:00Z"
  },
  {
    id: 4,
    name: "Noragi Overshirt",
    price: 980,
    description: "Japanese-inspired overshirt with traditional details and modern fit.",
    image: "/Products/Noragi.jpg",
    additionalImages: ["/Products/Noragi2.jpg"],
    colors: ["Navy", "Black"],
    sizes: ["M", "L", "XL"],
    inStock: true,
    isNew: false,
    isFeatured: false,
    category: "Shirts",
    material: "100% Linen",
    care: "Hand wash cold",
    sku: "NO-004",
    rating: 5.0,
    reviews: 12,
    createdAt: "2025-07-25T10:20:00Z",
    updatedAt: "2025-07-25T10:20:00Z"
  },
  {
    id: 5,
    name: "Camo Jacket",
    price: 1380,
    description: "Stylish camouflage jacket with premium materials and excellent craftsmanship.",
    image: "/Products/CamoJack.jpg",
    additionalImages: ["/Products/CamoJack2.jpg", "/Products/CamoJack3.jpg"],
    colors: ["Olive", "Black"],
    sizes: ["S", "M", "L"],
    inStock: true,
    isNew: true,
    isFeatured: true,
    category: "Outerwear",
    material: "95% Cotton, 5% Polyester",
    care: "Dry clean only",
    sku: "CJ-005",
    rating: 4.6,
    reviews: 45,
    createdAt: "2025-08-02T15:10:00Z",
    updatedAt: "2025-08-02T15:10:00Z"
  },
  {
    id: 6,
    name: "Regal Combo Set",
    price: 2420,
    description: "Premium matching set including blazer and trousers for a complete elegant look.",
    image: "/Products/RegalCombo.jpeg",
    additionalImages: ["/Products/RegalCombo2.jpeg", "/Products/RegalCombo3.jpeg"],
    colors: ["Navy", "Black", "Grey"],
    sizes: ["XS", "S", "M", "L", "XL"],
    inStock: true,
    isNew: true,
    isFeatured: true,
    category: "Sets",
    material: "Wool Blend",
    care: "Dry clean only",
    sku: "RCS-006",
    rating: 4.8,
    reviews: 28,
    createdAt: "2025-08-15T09:30:00Z",
    updatedAt: "2025-08-15T09:30:00Z"
  },
  {
    id: 7,
    name: "Zenkage Jacket",
    price: 1800,
    compareAt: 2200,
    description: "Luxurious jacket with exquisite attention to detail and unmatched comfort.",
    image: "/Products/ZenkageJack.jpg",
    additionalImages: ["/Products/ZenkageJack2.jpg", "/Products/ZenkageJack3.jpg"],
    colors: ["Black", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    isNew: false,
    isFeatured: false,
    category: "Outerwear",
    material: "Cashmere Blend",
    care: "Dry clean only",
    sku: "ZJ-007",
    rating: 4.9,
    reviews: 15,
    createdAt: "2025-06-20T13:15:00Z",
    updatedAt: "2025-06-20T13:15:00Z"
  },
  {
    id: 8,
    name: "Mocca Combo Set",
    price: 2280,
    description: "Elegant mocca set that combines style and comfort for a refined look.",
    image: "/Products/MoccaCombo.png",
    additionalImages: ["/Products/MoccaCombo2.png", "/Products/MoccaCombo3.jpg"],
    colors: ["Camel", "White", "Grey"],
    sizes: ["XS", "S", "M", "L", "XL"],
    inStock: true,
    isNew: false,
    isFeatured: true,
    category: "Sets",
    material: "Premium Cotton Blend",
    care: "Dry clean only",
    sku: "MCS-008",
    rating: 4.5,
    reviews: 67,
    createdAt: "2025-07-05T10:45:00Z",
    updatedAt: "2025-07-05T10:45:00Z"
  }
];

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      lastGeneratedId: initialProducts.length,
  adminOverrides: {},
  setAdminOverride: (id, data) => set(state => ({ adminOverrides: { ...(state.adminOverrides || {}), [id]: { ...(state.adminOverrides?.[id] || {}), ...data } } })),
  visibleCount: 9,
  pageSize: 9,
  page: 1,
  total: undefined,

      addProduct: (productData) => {
        const newId = get().lastGeneratedId + 1;
        const now = new Date().toISOString();
        
        const newProduct: Product = {
          ...productData,
          id: newId,
          rating: 0,
          reviews: 0,
          createdAt: now,
          updatedAt: now,
        };
        
        set(state => ({
          products: [...state.products, newProduct],
          lastGeneratedId: newId
        }));
        
        return newProduct;
      },
      // Load products from server (page 1) and replace local store
      loadProducts: async (page?: number, pageSize?: number) => {
        try {
          const p = page && Number(page) > 0 ? Number(page) : 1
          const ps = pageSize && Number(pageSize) > 0 ? Number(pageSize) : (get().pageSize ?? 9)
          const resp = await fetch(`/api/products?page=${p}&pageSize=${ps}`)
          if (!resp.ok) return
          const data = await resp.json()
          // handle older server responses that returned an array
          const items = Array.isArray(data) ? data : (data.items || [])
          const total = (data && typeof data.total === 'number') ? data.total : (Array.isArray(data) ? data.length : items.length)

          // If server responds with an empty array, do not overwrite local seeded products.
          if (items.length === 0) {
            if (!get().products || get().products.length === 0) {
              set({ products: initialProducts, lastGeneratedId: initialProducts.length, visibleCount: pageSize, total: initialProducts.length, page: 1 })
            }
            return
          }

          const now = Date.now()
          const mapped: Product[] = items.map((p: any) => {
            const createdAt = p.createdAt || new Date().toISOString()
            const createdTs = new Date(createdAt).getTime()
            const override = get().adminOverrides?.[Number(p.id)]
            const isNewServer = (typeof p.isNew === 'boolean') ? p.isNew : undefined
            const isNew = typeof override?.isNew === 'boolean' ? override.isNew : (typeof isNewServer === 'boolean' ? isNewServer : ((now - createdTs) < 1000 * 60 * 60 * 24 * 7))
            // preserve any richer local product data (colors/sizes) when server doesn't provide them
            // Match local product by id, or fallback to matching by title/name or slug (case-insensitive)
            const local = get().products.find(lp => {
              if (lp.id === Number(p.id)) return true
              const localName = (lp.name || '').toLowerCase()
              const serverTitle = (p.title || p.name || '').toString().toLowerCase()
              const serverSlug = (p.slug || '').toString().toLowerCase()
              if (localName && serverTitle && localName === serverTitle) return true
              if (localName && serverSlug && localName === serverSlug) return true
              return false
            })
            const colors = (p.colors && p.colors.length) ? p.colors : (local?.colors ?? [])
            const sizes = (p.sizes && p.sizes.length) ? p.sizes : (local?.sizes ?? [])
            return {
              id: Number(p.id),
              name: p.title || p.name || '',
              price: Number(p.price) || 0,
              compareAt: p.compareAt ?? undefined,
              description: p.description || '',
              image: (p.images && p.images.length) ? p.images[0] : '/Products/placeholder.jpg',
              additionalImages: (p.images && p.images.length > 1) ? p.images.slice(1) : [],
              colors,
              sizes,
              inStock: typeof p.inStock === 'boolean' ? p.inStock : true,
              isNew: !!isNew,
              isFeatured: !!p.isFeatured,
              category: p.category || 'Shirts',
              material: p.material || undefined,
              care: p.care || undefined,
              sku: p.sku || undefined,
              rating: Number(p.rating) || 0,
              reviews: Number(p.reviews) || 0,
              createdAt: createdAt,
              updatedAt: p.updatedAt || new Date().toISOString(),
            }
          })
          const maxId = mapped.reduce((m, it) => Math.max(m, it.id), 0)
          set({ products: mapped, lastGeneratedId: maxId, visibleCount: ps, page: p, total })
          try { (window as any).__productStoreTotal = total } catch (e) { /* ignore */ }
        } catch (e) {
          // ignore
        }
      },
      // Increase number of visible products by pageSize or fetch next page from server if available
      loadMore: async () => {
        const state = get()
        const pageSize = state.pageSize || 9
        const currentVisible = state.visibleCount || pageSize
        // if we already have more items locally, just increase visibleCount
        if (state.products.length > currentVisible) {
          set({ visibleCount: Math.min(state.products.length, currentVisible + pageSize) })
          return
        }
        // if server has more (total > products.length), fetch next page
        if (typeof state.total === 'number' && state.products.length < state.total) {
          const nextPage = (state.page || 1) + 1
          try {
            const resp = await fetch(`/api/products?page=${nextPage}&pageSize=${pageSize}`)
            if (!resp.ok) return
            const data = await resp.json()
            const items = Array.isArray(data) ? data : (data.items || [])
            const total = (data && typeof data.total === 'number') ? data.total : (Array.isArray(data) ? data.length : items.length)
            if (!Array.isArray(items) || items.length === 0) return
            const now = Date.now()
            const mapped: Product[] = items.map((p: any) => {
              const createdAt = p.createdAt || new Date().toISOString()
              const createdTs = new Date(createdAt).getTime()
              const override = get().adminOverrides?.[Number(p.id)]
              const isNewServer = (typeof p.isNew === 'boolean') ? p.isNew : undefined
              const isNew = typeof override?.isNew === 'boolean' ? override.isNew : (typeof isNewServer === 'boolean' ? isNewServer : ((now - createdTs) < 1000 * 60 * 60 * 24 * 7))
              return {
                id: Number(p.id),
                name: p.title || p.name || '',
                price: Number(p.price) || 0,
                compareAt: p.compareAt ?? undefined,
                description: p.description || '',
                image: (p.images && p.images.length) ? p.images[0] : '/Products/placeholder.jpg',
                additionalImages: (p.images && p.images.length > 1) ? p.images.slice(1) : [],
                colors: p.colors || [],
                sizes: p.sizes || [],
                inStock: typeof p.inStock === 'boolean' ? p.inStock : true,
                isNew: !!isNew,
                isFeatured: !!p.isFeatured,
                category: p.category || 'Shirts',
                material: p.material || undefined,
                care: p.care || undefined,
                sku: p.sku || undefined,
                rating: Number(p.rating) || 0,
                reviews: Number(p.reviews) || 0,
                createdAt: createdAt,
                updatedAt: p.updatedAt || new Date().toISOString(),
              }
            })
            const newProducts = [...state.products, ...mapped]
            set({ products: newProducts, visibleCount: Math.min(newProducts.length, currentVisible + pageSize), page: nextPage, total })
            try { (window as any).__productStoreTotal = total } catch (e) { /* ignore */ }
          } catch (e) {
            // ignore
          }
        }
      },
      resetPagination: () => {
        set(state => ({ visibleCount: state.pageSize }))
      },
      
      updateProduct: async (id, updatedData) => {
        try {
          // send to server
          const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? localStorage.getItem('authToken') ?? sessionStorage.getItem('authToken')
          const headers: Record<string,string> = { 'Content-Type': 'application/json' }
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }
          // Always include dev-bypass headers in DEV so the server's dev bypass will allow actions
          if (import.meta.env && import.meta.env.DEV) {
            const devAuthEnabled = String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true'
            if (devAuthEnabled) {
              if (String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true') headers['X-ADMIN'] = '1'
              const devAdmin = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(s=>s.trim()).filter(Boolean)[0] || (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com')
              headers['X-USER-EMAIL'] = devAdmin
            }
          } else if (!token) {
            // fallback for some older dev setups
            if (String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true') headers['x-admin'] = '1'
          }

          const resp = await fetch(`/api/products/${id}`, { method: 'PATCH', headers, body: JSON.stringify(updatedData) })
          if (!resp.ok) {
            const txt = await resp.text().catch(() => '')
            console.warn('updateProduct server failed', resp.status, txt)
            // If server says not found, maybe our local product id doesn't match server (seed/migration differences).
            // Try to find the server product by title/slug/name and retry using that id.
            if (resp.status === 404) {
              try {
                const listResp = await fetch(`/api/products?page=1&pageSize=100`)
                if (listResp.ok) {
                  const listJson = await listResp.json()
                  const items = Array.isArray(listJson) ? listJson : (listJson.items || [])

                  const getStr = (o: unknown, key: string): string => {
                    if (!o || typeof o !== 'object') return ''
                    const val = (o as Record<string, unknown>)[key]
                    if (val === undefined || val === null) return ''
                    try { return String(val).toLowerCase() } catch { return '' }
                  }

                  const getNum = (o: unknown, key: string): number | null => {
                    if (!o || typeof o !== 'object') return null
                    const val = (o as Record<string, unknown>)[key]
                    if (val === undefined || val === null) return null
                    const n = Number(val)
                    return Number.isNaN(n) ? null : n
                  }

                  const localName = getStr(updatedData as unknown, 'name') || getStr(updatedData as unknown, 'title')
                  const serverMatch = (items as unknown[]).find(it => {
                    const serverTitle = getStr(it, 'title') || getStr(it, 'name')
                    const serverSlug = getStr(it, 'slug')
                    if (localName && serverTitle && localName === serverTitle) return true
                    if (localName && serverSlug && localName === serverSlug) return true
                    return false
                  }) as unknown || null
                  if (serverMatch) {
                    const serverId = getNum(serverMatch, 'id')
                    if (serverId !== null) {
                      console.info('Retrying updateProduct with server id', serverId)
                      const retryResp = await fetch(`/api/products/${serverId}`, { method: 'PATCH', headers, body: JSON.stringify(updatedData) })
                      if (!retryResp.ok) {
                        const rtxt = await retryResp.text().catch(() => '')
                        toast.error(`Failed to update product: ${retryResp.status} ${rtxt}`)
                        return undefined
                      }
                      const serverProduct = await retryResp.json()
                      // map and set store
                      const updatedProduct = {
                        id: Number(serverProduct.id),
                        name: serverProduct.title || serverProduct.name || '',
                        price: Number(serverProduct.price) || 0,
                        compareAt: serverProduct.compareAt ?? undefined,
                        description: serverProduct.description || '',
                        image: (serverProduct.images && serverProduct.images.length) ? serverProduct.images[0] : '/Products/placeholder.jpg',
                        additionalImages: (serverProduct.images && serverProduct.images.length > 1) ? serverProduct.images.slice(1) : [],
                        colors: serverProduct.colors || [],
                        sizes: serverProduct.sizes || [],
                        inStock: typeof serverProduct.inStock === 'boolean' ? serverProduct.inStock : true,
                        // prefer admin override if present, otherwise use server-provided flag if available
                        isNew: (get().adminOverrides?.[Number(serverProduct.id)]?.isNew !== undefined) ? !!get().adminOverrides?.[Number(serverProduct.id)]?.isNew : !!serverProduct.isNew,
                        isFeatured: !!serverProduct.isFeatured,
                        category: serverProduct.category || 'Shirts',
                        material: serverProduct.material || undefined,
                        care: serverProduct.care || undefined,
                        sku: serverProduct.sku || undefined,
                        rating: Number(serverProduct.rating) || 0,
                        reviews: Number(serverProduct.reviews) || 0,
                        createdAt: serverProduct.createdAt || new Date().toISOString(),
                        updatedAt: serverProduct.updatedAt || new Date().toISOString(),
                      }
                      set(state => ({ products: state.products.map(p => p.id === id ? updatedProduct : p) }))
                      return updatedProduct
                    }
                  }
                }
              } catch (e) {
                // ignore fallback errors
              }
            }
            toast.error(`Failed to update product: ${resp.status} ${txt}`)
            return undefined
          }
          const serverProduct = await resp.json()
          const updatedProduct = {
            id: Number(serverProduct.id),
            name: serverProduct.title || serverProduct.name || '',
            price: Number(serverProduct.price) || 0,
            compareAt: serverProduct.compareAt ?? undefined,
            description: serverProduct.description || '',
            image: (serverProduct.images && serverProduct.images.length) ? serverProduct.images[0] : '/Products/placeholder.jpg',
            additionalImages: (serverProduct.images && serverProduct.images.length > 1) ? serverProduct.images.slice(1) : [],
            colors: serverProduct.colors || [],
            sizes: serverProduct.sizes || [],
            inStock: typeof serverProduct.inStock === 'boolean' ? serverProduct.inStock : true,
            // prefer admin override if present, otherwise use server-provided flag if available
            isNew: (get().adminOverrides?.[Number(serverProduct.id)]?.isNew !== undefined) ? !!get().adminOverrides?.[Number(serverProduct.id)]?.isNew : !!serverProduct.isNew,
            isFeatured: !!serverProduct.isFeatured,
            category: serverProduct.category || 'Shirts',
            material: serverProduct.material || undefined,
            care: serverProduct.care || undefined,
            sku: serverProduct.sku || undefined,
            rating: Number(serverProduct.rating) || 0,
            reviews: Number(serverProduct.reviews) || 0,
            createdAt: serverProduct.createdAt || new Date().toISOString(),
            updatedAt: serverProduct.updatedAt || new Date().toISOString(),
          }
          set(state => ({ products: state.products.map(p => p.id === id ? updatedProduct : p) }))
          return updatedProduct
        } catch (e) {
          console.error('updateProduct error', e)
          toast.error('Failed to update product. Please try again.')
          return undefined
        }
      },
      
      deleteProduct: async (id) => {
        // try to call backend delete; include supabase token if present, otherwise dev header
        const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? localStorage.getItem('authToken') ?? sessionStorage.getItem('authToken')
        const headers: Record<string,string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        if (import.meta.env && import.meta.env.DEV) {
          const devAuthEnabled = String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true'
          if (devAuthEnabled) {
            if (String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true') headers['X-ADMIN'] = '1'
            const devAdmin = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(s=>s.trim()).filter(Boolean)[0] || (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com')
            headers['X-USER-EMAIL'] = devAdmin
          }
        } else if (!token) {
          if (String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true') headers['x-admin'] = '1'
        }

        const resp = await fetch(`/api/products/${id}`, { method: 'DELETE', headers })
        if (!resp.ok) {
          const text = await resp.text().catch(() => '')
          console.warn('deleteProduct server failed', resp.status, text)
          toast.error(`Failed to delete product: ${resp.status} ${text}`)
          throw new Error(`Failed to delete product on server: ${resp.status} ${text}`)
        }

        // After successful server delete, re-sync the product list from server to avoid
        // local-store drift and to ensure pagination remains correct (older products will reappear).
        try {
          await get().loadProducts()
        } catch (e) {
          // As a fallback, remove locally if loadProducts fails
          set(state => ({ products: state.products.filter(p => p.id !== id) }))
        }
      },
      
      getProduct: (id) => {
        return get().products.find(p => p.id === id);
      },
      
      generateImageUrl: (file) => {
        // Generate a URL for the file (this is a client-side URL)
        return URL.createObjectURL(file);
      }
    }),
    {
      name: 'vinc-product-storage',
    }
  )
);
