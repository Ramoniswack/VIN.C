import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/ProductForm";
import { useProductStore, Product } from "@/store/productStore";
import { ArrowLeft, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function AddProduct() {
  const { addProduct } = useProductStore();
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
      
      // Create the product with the required fields
      addProduct({
        name: name || "",
        price: price || 0,
        compareAt: compareAt,
        description: description,
        image: image || "/Products/placeholder.jpg",
        additionalImages: additionalImages || [],
        colors: colors || [],
        sizes: sizes || [],
        inStock: inStock ?? true,
        isNew: isNew ?? false,
        isFeatured: isFeatured ?? false,
        category: category || "Shirts",
        material: material,
        care: care,
        sku: sku
      });
      
      // Navigate to product list with success message
      navigate("/admin?tab=products&success=created");
    } catch (error) {
      console.error("Error creating product:", error);
      // Would handle error state in a real app
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
