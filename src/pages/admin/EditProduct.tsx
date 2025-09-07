import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/ProductForm";
import { useProductStore, Product } from "@/store/productStore";
import { ArrowLeft, Edit, ShoppingBag, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function EditProduct() {
  const { productId } = useParams<{ productId: string }>();
  const { getProduct, updateProduct, deleteProduct } = useProductStore();
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
        setError("Product not found. It may have been deleted.");
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
      
      // Update the product
      updateProduct(id, {
        name, price, compareAt, description, image, additionalImages,
        colors, sizes, inStock, isNew, isFeatured, category, 
        material, care, sku
      });
      
      // Navigate to product list with success message
      navigate("/admin?tab=products&success=updated");
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin?tab=products")}
            className="h-9 w-9 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
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
          <Button
            variant="destructive"
            className="text-sm h-9"
            onClick={() => {
              // This would open a confirmation dialog in a real app
              if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                deleteProduct(product.id);
                toast.error("Product deleted", {
                  description: `${product.name} has been removed from your inventory`,
                });
                navigate("/admin?tab=products");
              }
            }}
          >
            Delete
          </Button>
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
        />
      </div>
    </div>
  );
}
