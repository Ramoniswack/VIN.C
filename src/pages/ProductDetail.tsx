import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Minus, Plus, Heart, Share2, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useProductStore, Product } from "@/store/productStore";
import { toast as sonner } from '@/components/ui/sonner'

// Helper utilities to safely work with unknown server payloads (avoid 'any')
const asRecord = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null) ? v as Record<string, unknown> : {};
const extractId = (item: unknown): number => {
  const o = asRecord(item);
  const prod = asRecord(o['product']);
  const pid = prod['id'] ?? o['productId'] ?? o['id'];
  if (typeof pid === 'number') return pid;
  if (typeof pid === 'string' && pid.trim() !== '') return Number(pid);
  return 0;
};
const toWishlistItem = (v: unknown) => {
  const o = asRecord(v);
  const prod = asRecord(o['product']);
              try { window.dispatchEvent(new CustomEvent('vinc:data-changed')) } catch (e) { /* ignore */ }
  const id = extractId(v);
  const productId = (() => {
    const pid = prod['id'] ?? o['productId'] ?? o['id'];
    if (typeof pid === 'number') return pid;
    if (typeof pid === 'string' && pid.trim() !== '') return Number(pid);
    return undefined;
  })();
  const title = (typeof prod['title'] === 'string') ? prod['title'] as string : (typeof o['title'] === 'string' ? o['title'] as string : '');
  const image = (Array.isArray(prod['images']) && typeof prod['images'][0] === 'string') ? (prod['images'][0] as string) : (typeof o['image'] === 'string' ? o['image'] as string : '');
  return { id, productId, title, image };
};

export default function ProductDetail() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProduct, products } = useProductStore();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const addToCart = useCartStore((state) => state.addToCart);
  const wishlistItems = useWishlistStore(state => state.items)
  const addWishlist = useWishlistStore(state => state.add)
  const removeWishlist = useWishlistStore(state => state.remove)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  
  // Get product from store
  const product = getProduct(Number(productId));
  
  // Get related products: prefer complementary categories (not same category)
  const complementaryMap: Record<string, string[]> = {
    Shirts: ['Trousers', 'Outerwear'],
    Trousers: ['Shirts', 'Outerwear'],
    Outerwear: ['Shirts', 'Trousers'],
    Blazers: ['Trousers', 'Shirts', 'Outerwear'],
    Accessories: ['Shirts', 'Trousers', 'Outerwear', 'Sets'],
    Sets: ['Trousers', 'Outerwear', 'Shirts']
  };

  const getRelatedProducts = () => {
    if (!product) return [] as Product[];
    const preferred = complementaryMap[product.category] ?? [];
    // first try to get products from preferred complementary categories
    let picks = products.filter(p => p.id !== product.id && preferred.includes(p.category));
    // if not enough, fill with other categories excluding the same category
    if (picks.length < 3) {
      const filler = products.filter(p => p.id !== product.id && p.category !== product.category && !picks.includes(p));
      picks = picks.concat(filler);
    }
    return picks.slice(0, 3);
  };

  const relatedProducts = getRelatedProducts();
    
  // Set default color when product loads
  useEffect(() => {
    if (product) {
      if (product.colors && product.colors.length > 0) setSelectedColor(product.colors[0]);
      // If product has no colors or sizes defined, set defaults so Add to Cart is enabled
      if ((!product.colors || product.colors.length === 0)) setSelectedColor(null)
      if ((!product.sizes || product.sizes.length === 0)) setSelectedSize('')
    }
  }, [product]);

  // Image carousel helpers
  const totalImages = 1 + (product?.additionalImages?.length || 0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setSelectedImage((s) => (s + 1) % totalImages);
      if (e.key === 'ArrowLeft') setSelectedImage((s) => (s - 1 + totalImages) % totalImages);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [totalImages]);
  
  // Redirect if product not found
  useEffect(() => {
    if (!product && products.length > 0) {
      navigate('/shop');
    }
  }, [product, products, navigate]);
  
  if (!product) {
    return <div className="min-h-screen bg-bg flex items-center justify-center">Loading...</div>;
  }
  
  // Create variants based on product data
  const variants = product.colors.flatMap(color => 
    product.sizes.map(size => ({
      id: `${product.id}-${color}-${size}`,
      size,
      color,
      inventory: product.inStock ? 10 : 0, // Mock inventory
      sku: `${product.name.slice(0, 2).toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${size}`
    }))
  );
  
  const selectedVariant = selectedColor && selectedSize ? 
    variants.find(v => v.color === selectedColor && v.size === selectedSize) : 
    undefined;

  // If product has no variants defined (no colors & no sizes), allow adding to cart
  const hasVariants = (product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0)
  const isInStock = hasVariants ? (selectedVariant ? product.inStock && selectedVariant.inventory > 0 : false) : product.inStock;
  
  const availableSizes = selectedColor ?
    variants
      .filter(v => v.color === selectedColor && v.inventory > 0)
      .map(v => v.size) :
    [];

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      // force login and return to this product afterwards
      const next = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)
      navigate(`/auth?next=${next}`)
      return
    }
    // allow adding when variantless product is in stock, or when a variant is selected
    if ((hasVariants && selectedVariant && isInStock && selectedColor) || (!hasVariants && isInStock)) {
      // Try to persist to server first, then hydrate local store from server
      (async () => {
        try {
          // build headers (support dev fallback like other pages)
          const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
          const headers: Record<string,string> = { 'Content-Type': 'application/json' }
          if (token) headers['Authorization'] = `Bearer ${token}`
          else if (import.meta.env && import.meta.env.DEV) {
            const devAuthEnabled = String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true'
            // include dev email header so backend dev-bypass accepts the request only when explicitly enabled
            if (devAuthEnabled) {
              headers['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
              headers['X-ADMIN'] = '1'
            }
          }

          const rawVariantObj = { size: selectedSize || undefined, color: selectedColor || undefined, sku: selectedVariant?.sku }
          // If variant has no meaningful keys (all undefined), send null so backend stores null instead of '{}'
          const hasVariant = Object.values(rawVariantObj).some(v => v !== undefined && v !== null)
          const body = { productId: product.id, quantity, variant: hasVariant ? JSON.stringify(rawVariantObj) : null }
          const resp = await fetch('/api/cart', { method: 'POST', headers, body: JSON.stringify(body) })
          if (!resp.ok) {
            // fallback to local-only add when server not available
            addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, variant: { size: selectedSize, color: selectedColor, sku: selectedVariant?.sku }, quantity })
            try { sonner('Added to cart', { description: `${product.name} added to your cart (local).` }) } catch (e) { console.debug('toast failed', e) }
            return
          }

          // if server accepted the add, fetch authoritative cart and hydrate (do not also do an optimistic local add)
          try {
            const fetchResp = await fetch('/api/cart', { headers })
            if (fetchResp.ok) {
              const j = await fetchResp.json()
              const items = Array.isArray(j.items) ? j.items : []
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mapped = items.map((c: any) => ({
                id: Number((c.product && c.product.id) || c.productId || c.id),
                name: (c.product && (c.product.title || '')) || '',
                price: Number(((c.product && c.product.price) || 0) as number) / 100,
                image: (c.product && Array.isArray(c.product.images) ? c.product.images[0] : '') || '',
                variant: c.variant ? (typeof c.variant === 'string' ? (() => { try { return JSON.parse(c.variant) } catch { return undefined } })() : c.variant) : undefined,
                quantity: Number(c.quantity || 1)
              }))
              try { useCartStore.getState().setItems(mapped) } catch (e) { /* ignore */ }
            }
          } catch (e) { console.debug('refresh cart after add failed', e) }

          try { sonner('Added to cart', { description: `${product.name} added to your cart.` }) } catch (e) { console.debug('toast failed', e) }
        } catch (e) {
          // network or unexpected error: fall back to local store for resiliency
          console.debug('add to cart failed, falling back to local', e)
          addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, variant: { size: selectedSize, color: selectedColor, sku: selectedVariant?.sku }, quantity })
          try { sonner('Added to cart', { description: `${product.name} added to your cart (local).` }) } catch (e) { console.debug('toast failed', e) }
        }
      })()
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-[4/5] overflow-hidden bg-mink/10 relative">
              {/* Show main image or first additional image based on selectedImage */}
              <img
                src={selectedImage === 0 ? 
                  (product.image.startsWith('/') ? product.image : `/${product.image}`) : 
                  (product.additionalImages[selectedImage - 1].startsWith('/') ? 
                    product.additionalImages[selectedImage - 1] : 
                    `/${product.additionalImages[selectedImage - 1]}`)
                }
                alt={product.name}
                className="w-full h-full object-cover"
              />
                {/* Prev/Next arrows */}
                {totalImages > 1 && (
                  <>
                    <IconButton aria-label="Previous image" onClick={(e: React.MouseEvent) => { e.stopPropagation(); prevImage(); }} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-bg/70 text-paper rounded-full p-2 hover:bg-bg/90 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </IconButton>
                    <IconButton aria-label="Next image" onClick={(e: React.MouseEvent) => { e.stopPropagation(); nextImage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-bg/70 text-paper rounded-full p-2 hover:bg-bg/90 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </IconButton>
                  </>
                )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {/* Main image + additional images */}
              <button
                onClick={() => setSelectedImage(0)}
                className={`aspect-square overflow-hidden border-2 transition-colors ${
                  selectedImage === 0 ? 'border-accent' : 'border-transparent hover:border-graphite/30'
                }`}
              >
                <img
                  src={product.image.startsWith('/') ? product.image : `/${product.image}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </button>
              
              {product.additionalImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index + 1)}
                  className={`aspect-square overflow-hidden border-2 transition-colors ${
                    selectedImage === index + 1 ? 'border-accent' : 'border-transparent hover:border-graphite/30'
                  }`}
                >
                  <img
                    src={image.startsWith('/') ? image : `/${image}`}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-display font-medium text-paper mb-2">{product.name}</h1>
              <p className="text-graphite mb-4">{product.description || "Premium quality product"}</p>
              <div className="flex items-center space-x-3">
                <span className="text-2xl text-paper">${product.price}</span>
                {product.compareAt && (
                  <span className="text-xl text-graphite line-through">${product.compareAt}</span>
                )}
                {product.compareAt && (
                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                    Save ${product.compareAt - product.price}
                  </Badge>
                )}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-sm font-medium text-paper mb-3">Color</h3>
              <div className="flex space-x-3">
                {product.colors && product.colors.length > 0 ? (
                  product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setSelectedSize(""); // Reset size when color changes
                      }}
                      className={`px-4 py-2 border rounded-md transition-colors ${
                        selectedColor === color
                          ? 'border-accent text-accent'
                          : 'border-graphite/30 text-paper hover:border-accent/50'
                      }`}
                    >
                      {color}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-graphite">Default color</div>
                )}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-sm font-medium text-paper mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes && product.sizes.length > 0 ? (
                  product.sizes.map((size) => {
                    const isAvailable = availableSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => isAvailable && setSelectedSize(size)}
                        disabled={!isAvailable}
                        className={`px-4 py-2 border rounded-md transition-colors ${
                          selectedSize === size
                            ? 'border-accent text-accent'
                            : isAvailable
                            ? 'border-graphite/30 text-paper hover:border-accent/50'
                            : 'border-graphite/10 text-graphite/50 cursor-not-allowed'
                        }`}
                      >
                        {size}
                        {!isAvailable && <span className="ml-1 text-xs">(Out)</span>}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-sm text-graphite">One size</div>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-medium text-paper mb-3">Quantity</h3>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-paper w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={selectedVariant ? quantity >= selectedVariant.inventory : true}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                disabled={hasVariants ? (!selectedSize || !isInStock) : !isInStock}
                className="w-full h-12 text-base"
              >
                {hasVariants ? (!selectedSize ? 'Select Size' : !isInStock ? 'Out of Stock' : 'Add to Cart') : (!isInStock ? 'Out of Stock' : 'Add to Cart')}
              </Button>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!isAuthenticated) {
                      const next = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)
                      navigate(`/auth?next=${next}`)
                      return
                    }
                    const inList = wishlistItems.some(i => Number(i.productId ?? i.id) === product.id)
                    if (inList) {
                      removeWishlist(String(product.id))
                      try {
                        const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
                        const headers: Record<string,string> = { 'Content-Type': 'application/json' }
                        if (token) headers['Authorization'] = `Bearer ${token}`
                        else if (import.meta.env && import.meta.env.DEV) {
                          // dev fallback headers so backend.requireAuth will accept the request
                          headers['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
                          headers['X-ADMIN'] = '1'
                        }
                        const resp = await fetch('/api/wishlist', { method: 'DELETE', headers, body: JSON.stringify({ productId: product.id }) })
                        if (!resp.ok) {
                          try { const json = await resp.json(); console.warn('Wishlist DELETE failed', resp.status, json) } catch { console.warn('Wishlist DELETE failed', resp.status) }
                        }
                        try {
                          const fetchResp = await fetch('/api/wishlist', { headers })
                          if (fetchResp.ok) {
                            const j = await fetchResp.json()
                            const items = Array.isArray(j.items) ? j.items : []
                            const local = useWishlistStore.getState().items || []
                            // helpers to safely extract fields from unknown server payloads
                            const extractId = (item: unknown): number => {
                              if (typeof item !== 'object' || item === null) return 0;
                              const o = item as Record<string, unknown>;
                              const prod = o['product'];
                              if (prod && typeof prod === 'object' && prod !== null) {
                                const pid = (prod as Record<string, unknown>)['id'];
                                if (typeof pid === 'number' || typeof pid === 'string') return Number(pid);
                              }
                              const pid2 = o['productId'] ?? o['id'];
                              if (typeof pid2 === 'number' || typeof pid2 === 'string') return Number(pid2);
                              return 0;
                            };

                            const toWishlistItem = (v: unknown) => {
                              const o = (typeof v === 'object' && v !== null) ? v as Record<string, unknown> : {} as Record<string, unknown>;
                              const prod = o['product'];
                              const id = extractId(v);
                              const productId = (() => {
                                if (prod && typeof prod === 'object' && prod !== null) {
                                  const pid = (prod as Record<string, unknown>)['id'];
                                  if (typeof pid === 'number' || typeof pid === 'string') return Number(pid);
                                }
                                const pid2 = o['productId'] ?? o['id'];
                                if (typeof pid2 === 'number' || typeof pid2 === 'string') return Number(pid2);
                                return undefined;
                              })();
                              const title = (() => {
                                if (prod && typeof prod === 'object' && prod !== null) {
                                  const t = (prod as Record<string, unknown>)['title'];
                                  if (typeof t === 'string') return t;
                                }
                                const t2 = o['title'];
                                return typeof t2 === 'string' ? t2 : '';
                              })();
                              const image = (() => {
                                if (prod && typeof prod === 'object' && prod !== null) {
                                  const imgs = (prod as Record<string, unknown>)['images'];
                                  if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'string') return imgs[0];
                                }
                                const img = o['image'];
                                return typeof img === 'string' ? img : '';
                              })();
                              return { id, productId, title, image };
                            };

                            const serverMap = new Map<number | string, unknown>();
                            for (const it of items) serverMap.set(extractId(it), it as unknown);
                            for (const l of local) {
                              const pid = extractId(l);
                              if (!serverMap.has(pid)) serverMap.set(pid, l as unknown);
                            }
                            const merged = Array.from(serverMap.values()).map(toWishlistItem);
                            useWishlistStore.getState().setItems(merged)
                          }
                        } catch (e) { console.debug('fetch wishlist after delete failed', e) }
                      } catch (e) { /* ignore */ }
                      setIsWishlisted(false)
                      try { sonner('Removed from wishlist', { description: `${product.name} removed from your wishlist.` }) } catch (e) { console.debug('toast failed', e) }
                    } else {
                      addWishlist({ id: String(product.id), productId: product.id, title: product.name, image: product.image })
                      try {
                        const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
                        const headers: Record<string,string> = { 'Content-Type': 'application/json' }
                        if (token) headers['Authorization'] = `Bearer ${token}`
                        else if (import.meta.env && import.meta.env.DEV) {
                          headers['X-USER-EMAIL'] = (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com') as string
                        }
                        const resp = await fetch('/api/wishlist', { method: 'POST', headers, body: JSON.stringify({ productId: product.id }) })
                        if (!resp.ok) {
                          try { const json = await resp.json(); console.warn('Wishlist POST failed', resp.status, json) } catch { console.warn('Wishlist POST failed', resp.status) }
                        }
                        try {
                          const fetchResp = await fetch('/api/wishlist', { headers })
                          if (fetchResp.ok) {
                            const j = await fetchResp.json()
                            const items = Array.isArray(j.items) ? j.items : []
                            const local = useWishlistStore.getState().items || []
                            const serverMap = new Map<number | string, unknown>()
                            for (const it of items) serverMap.set(extractId(it), it as unknown)
                            for (const l of local) {
                              const pid = extractId(l)
                              if (!serverMap.has(pid)) serverMap.set(pid, l as unknown)
                            }
                            const merged = Array.from(serverMap.values()).map(toWishlistItem)
                            useWishlistStore.getState().setItems(merged)
                          }
                        } catch (e) { console.debug('fetch wishlist after post failed', e) }
                      } catch (e) { /* ignore */ }
                      setIsWishlisted(true)
                      try { sonner('Added to wishlist', { description: `${product.name} added to your wishlist.` }) } catch (e) { console.debug('toast failed', e) }
                    }
                  }}
                  className="flex-1"
                >
                  <Heart className={`w-4 h-4 mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
                  Wishlist
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="space-y-3 pt-6 border-t border-graphite/20">
              <div className="flex items-center space-x-3 text-sm text-graphite">
                <Truck className="w-4 h-4" />
                <span>Free shipping on orders over $500</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-graphite">
                <RotateCcw className="w-4 h-4" />
                <span>Free returns within 30 days</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-graphite">
                <Shield className="w-4 h-4" />
                <span>2-year craftsmanship warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-display font-medium text-paper mb-6">Details</h2>
            <p className="text-graphite leading-relaxed mb-8">{product.description || "A premium quality product crafted with attention to detail."}</p>
            
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="fabric" className="border-graphite/20">
                <AccordionTrigger className="text-paper hover:text-accent">
                  Fabric & Construction
                </AccordionTrigger>
                <AccordionContent className="text-graphite">
                  {product.material || "Premium fabric"}. Expertly tailored with hand-finished details including 
                  pick-stitched lapels, functional buttonholes, and internal canvas construction 
                  for superior shape retention.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="care" className="border-graphite/20">
                <AccordionTrigger className="text-paper hover:text-accent">
                  Care Instructions
                </AccordionTrigger>
                <AccordionContent className="text-graphite">
                  {product.care || "Handle with care"}. Professional cleaning recommended to maintain 
                  the garment's structure and finish. Store on padded hangers.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="sizing" className="border-graphite/20">
                <AccordionTrigger className="text-paper hover:text-accent">
                  Sizing & Fit
                </AccordionTrigger>
                <AccordionContent className="text-graphite">
                  Standard fit. Model is 6'1" wearing size M. 
                  For personalized fit recommendations, contact our styling team.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div>
            <h2 className="text-2xl font-display font-medium text-paper mb-6">Complete the Look</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedProducts.length > 0 ? (
                relatedProducts.map((item) => (
                  <div 
                    key={item.id} 
                    className="group cursor-pointer"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-mink/10 mb-3">
                      <img
                        src={item.image.startsWith('/') ? item.image : `/${item.image}`}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="text-sm font-medium text-paper group-hover:text-accent transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-graphite">${item.price}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-graphite">
                  No related products found
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}