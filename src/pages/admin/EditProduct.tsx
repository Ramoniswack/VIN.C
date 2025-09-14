import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, IconButton } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/ProductForm";
import { useProductStore, Product } from "@/store/productStore";
import { ArrowLeft, Edit, ShoppingBag, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function EditProduct() {
  const params = useParams<{ productId?: string; id?: string }>();
  const productId = params.productId ?? params.id
  const { getProduct, updateProduct, deleteProduct } = useProductStore();
  const { setAdminOverride } = useProductStore();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (productId) {
      const id = parseInt(productId, 10);
      if (isNaN(id)) {
        setError("Invalid product ID.");
        return;
      }
      
      const foundProduct = getProduct(id);
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        // Try fetching the product directly from the server as a fallback
        (async () => {
          try {
            const resp = await fetch(`/api/products/${id}`)
            if (!resp.ok) {
              setError('Product not found. It may have been deleted.')
              return
            }
            const json = await resp.json()
            setProduct(json)
          } catch (e) {
            setError("Product not found. It may have been deleted.")
          }
        })()
      }
    }
  }, [productId, getProduct]);
  
  const handleSubmit = async (data: Partial<Product> & { mainImageFile?: File, additionalImageFiles?: File[] }) => {
    setIsSubmitting(true);
    
    try {
      if (!productId) {
        throw new Error("Product ID is missing");
      }
      
      const id = parseInt(productId, 10);
      if (isNaN(id)) {
        throw new Error("Invalid product ID");
      }
      
      // Extract just the fields that belong to the Product type
      const {
        name, price, compareAt, description, image, additionalImages,
        colors, sizes, inStock, isNew, isFeatured, category, 
        material, care, sku
      } = data;
      
      // If a new main image file is provided, upload via FormData to the server
      if (data.mainImageFile) {
        const form = new FormData()
        if (name) form.append('name', name)
        if (price !== undefined) form.append('price', String(price))
        if (description) form.append('description', description)
        if (category) form.append('category', category)
        if (typeof inStock !== 'undefined') form.append('inStock', String(inStock))
        if (material) form.append('material', material)
        if (care) form.append('care', care)
        if (sku) form.append('sku', sku)
        form.append('mainImage', data.mainImageFile)
        // include colors/sizes as JSON strings for multipart form handling
        if (colors && Array.isArray(colors) && colors.length) form.append('colors', JSON.stringify(colors))
        if (sizes && Array.isArray(sizes) && sizes.length) form.append('sizes', JSON.stringify(sizes))

        const token = localStorage.getItem('supabase_access_token') || sessionStorage.getItem('supabase_access_token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

        const resp = await fetch(`/api/products/${id}/with-image`, {
          method: 'PATCH',
          body: form,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

  if (!resp.ok) throw new Error('Failed to update product with image')
  // navigate with success and show toast
  toast.success('Product updated')
  navigate('/admin?tab=products&success=updated')
        return
      }

      // Update the product (no main image change)
      const updated = await updateProduct(id, {
        name, price, compareAt, description, image, additionalImages,
        colors, sizes, inStock, isNew, isFeatured, category, 
        material, care, sku
      });
  if (!updated) throw new Error('Server update failed')
  // show toast and navigate to product list with success message
  toast.success('Product updated')
  navigate('/admin?tab=products&success=updated');
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <Alert variant="destructive" className="mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <AlertDescription className="text-base">{error}</AlertDescription>
        </Alert>
        
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => navigate("/admin?tab=products")}
            className="px-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
          </Button>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
        <p className="text-paper">Loading product details...</p>
      </div>
    );
  }
  
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
            <div className="flex items-center text-sm text-graphite space-x-2 flex-wrap">
              <span className="hover:text-accent cursor-pointer" onClick={() => navigate("/admin")}>Dashboard</span>
              <span>/</span>
              <span className="hover:text-accent cursor-pointer" onClick={() => navigate("/admin?tab=products")}>Products</span>
              <span>/</span>
              <span className="text-paper truncate max-w-[200px]">{product.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-medium text-paper mt-1 flex items-center truncate">
              <span className="bg-accent/10 text-accent p-1 rounded mr-2 shrink-0">
                <Edit className="h-5 w-5" />
              </span>
              <span className="truncate">Edit: {product.name}</span>
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
          <div className="flex items-center space-x-2">
            <Button
              variant="destructive"
              className="text-sm h-9"
              onClick={() => {
                (async () => {
                  if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return
                  try {
                    await deleteProduct(product.id)
                    toast.success("Product deleted", {
                      description: `${product.name} has been removed from your inventory`,
                    });
                    navigate("/admin?tab=products");
                  } catch (e) {
                    console.error('delete failed', e)
                    setError('Failed to delete product')
                  }
                })()
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-mink/5 rounded-lg p-2">
        <div className="flex items-center space-x-2 p-3 bg-accent/10 rounded-md mb-4">
          <ShoppingBag className="h-5 w-5 text-accent shrink-0" />
          <p className="text-sm text-paper">
            You are editing <strong>{product.name}</strong>. 
            <span className="hidden sm:inline"> Make your changes and click "Save Changes" when you're done.</span>
          </p>
        </div>
        
        <ProductForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
          product={product}
          onToggleInStock={async (next?: boolean) => {
            try {
              const newVal = typeof next === 'boolean' ? next : !product.inStock
              // optimistic update in UI
              setProduct(prev => prev ? ({ ...prev, inStock: newVal } as Product) : prev)
              const updated = await updateProduct(product.id, { inStock: newVal })
              if (updated) setProduct(updated)
              toast.success('Inventory updated')
            } catch (e) {
              console.error('toggle inStock failed', e)
              toast.error('Failed to update inventory')
            }
          }}
          onToggleIsNew={async (next?: boolean) => {
            try {
              const newVal = typeof next === 'boolean' ? next : !product.isNew
              // set admin override immediately so store mapping will respect this admin decision
              try { setAdminOverride(product.id, { isNew: newVal }) } catch (e) { /* ignore */ }
              const updated = await updateProduct(product.id, { isNew: newVal })
              if (updated) {
                setProduct(updated)
              }
              toast.success('Product flag updated')
            } catch (e) {
              console.error('toggle isNew failed', e)
              toast.error('Failed to update product flag')
            }
          }}
        />
      </div>
    </div>
  );
}
