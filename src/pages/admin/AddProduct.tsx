import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, IconButton } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/ProductForm";
import { useProductStore, Product } from "@/store/productStore";
import { ArrowLeft, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function AddProduct() {
  const { addProduct, loadProducts } = useProductStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (data: Partial<Product> & { mainImageFile?: File, additionalImageFiles?: File[] }) => {
    setIsSubmitting(true);
    
    try {
      // Extract just the fields that belong to the Product type
      const {
        name, price, compareAt, description, image, additionalImages,
        colors, sizes, inStock, isNew, isFeatured, category, 
        material, care, sku
      } = data;
      
      // Prepare FormData to send to the server, including images
      const form = new FormData()
      form.append('name', name || '')
      form.append('price', String(price || 0))
      if (compareAt !== undefined) form.append('compareAt', String(compareAt))
      if (description) form.append('description', description)
      if (category) form.append('category', category)
      if (typeof inStock !== 'undefined') form.append('inStock', String(inStock))
      if (material) form.append('material', material)
      if (care) form.append('care', care)
      if (sku) form.append('sku', sku)

      if (data.mainImageFile) form.append('mainImage', data.mainImageFile)
      if (data.additionalImageFiles && data.additionalImageFiles.length) {
        for (const f of data.additionalImageFiles) form.append('additionalImages', f)
      }
      // include colors/sizes as JSON strings for multipart form handling
      if (colors && Array.isArray(colors) && colors.length) form.append('colors', JSON.stringify(colors))
      if (sizes && Array.isArray(sizes) && sizes.length) form.append('sizes', JSON.stringify(sizes))

      // Try to read supabase token from persistent storage
      const token = localStorage.getItem('supabase_access_token') || sessionStorage.getItem('supabase_access_token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

      // Build headers: prefer Authorization but in local dev fallback to X-ADMIN/X-USER-EMAIL
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      } else if (import.meta.env.DEV) {
  // local dev bypass only when explicitly enabled
  if (String(import.meta.env.VITE_DEV_AUTH_ENABLED) === 'true') headers['X-ADMIN'] = '1'
        // prefer explicit VITE_ADMIN_EMAILS if present, otherwise DEV_USER_EMAIL
        const devAdmin = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(s=>s.trim()).filter(Boolean)[0] || (import.meta.env.VITE_DEV_USER_EMAIL || 'dev@example.com')
        headers['X-USER-EMAIL'] = devAdmin
      }

      const resp = await fetch('/api/products-with-image', {
        method: 'POST',
        body: form,
        headers: Object.keys(headers).length ? headers : undefined,
      })

      const body = await resp.json().catch(() => null)
      if (!resp.ok) {
        if (resp.status === 409) {
          toast.error(body?.error || 'Product name already exists')
        } else {
          toast.error(body?.error || 'Failed to create product')
        }
        setIsSubmitting(false)
        return
      }

      toast.success(body?.message || 'Product created')
      // Refresh local product list from server so local store uses the server-assigned IDs
      // This ensures subsequent actions (edit/delete) target the correct server records
      try {
        await loadProducts()
      } catch (e) {
        // ignore load failures; the UI will still navigate and user can refresh
      }
      // Navigate to product list with success message
      navigate('/admin?tab=products&success=created')
    } catch (error: unknown) {
      console.error("Error creating product:", error);
      const message = error instanceof Error ? error.message : String(error)
      toast.error(message || 'Failed to create product')
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-16">
      {/* Header with breadcrumb */}
      <div className="bg-mink/5 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <IconButton
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin?tab=products")}
            className="h-9 w-9 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
          <div>
            <div className="flex items-center text-sm text-graphite space-x-2">
              <span className="hover:text-accent cursor-pointer" onClick={() => navigate("/admin")}>Dashboard</span>
              <span>/</span>
              <span className="hover:text-accent cursor-pointer" onClick={() => navigate("/admin?tab=products")}>Products</span>
              <span>/</span>
              <span className="text-paper">New Product</span>
            </div>
            <h1 className="text-2xl font-display font-medium text-paper mt-1 flex items-center">
              <span className="bg-accent/10 text-accent p-1 rounded mr-2">
                <Plus className="h-5 w-5" />
              </span>
              Add New Product
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate("/admin?tab=products")}
            className="text-sm h-9"
          >
            Cancel
          </Button>
        </div>
      </div>
      
      <div className="bg-mink/5 rounded-lg p-2">
        <div className="flex items-center space-x-2 p-3 bg-accent/10 rounded-md mb-4">
          <ShoppingBag className="h-5 w-5 text-accent" />
          <p className="text-sm text-paper">
            Fill out the form below to add a new product to your inventory. 
            <span className="hidden sm:inline"> Required fields are marked with an asterisk (*).</span>
          </p>
        </div>
        
        <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
