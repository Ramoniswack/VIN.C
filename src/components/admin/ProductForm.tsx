import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { 
  Product, 
  ProductCategory, 
  ProductSize, 
  ProductColor,
  ImageFile
} from "@/store/productStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PhotoUploader } from "./PhotoUploader";
import { X, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Partial<Product> & { mainImageFile?: File, additionalImageFiles?: File[] }) => void;
  isSubmitting: boolean;
}

type ProductFormValues = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviews'>;

const SIZES: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS: ProductColor[] = ['Black', 'White', 'Navy', 'Camel', 'Olive', 'Grey', 'Red', 'Blue', 'Brown'];
const CATEGORIES: ProductCategory[] = ['Blazers', 'Trousers', 'Shirts', 'Outerwear', 'Accessories', 'Sets'];

export const ProductForm = ({ 
  product, 
  onSubmit,
  isSubmitting
}: ProductFormProps) => {
  const navigate = useNavigate();
  const isEditing = !!product;
  const [mainImageFile, setMainImageFile] = useState<ImageFile | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<ImageFile[]>([]);
  
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<ProductFormValues>({
    defaultValues: product ? {
      ...product
    } : {
      name: "",
      price: 0,
      colors: [],
      sizes: [],
      inStock: true,
      isNew: false,
      isFeatured: false,
      category: 'Shirts',
      image: "/Products/placeholder.jpg",
      additionalImages: [],
    }
  });

  const watchColors = watch("colors", []);
  const watchSizes = watch("sizes", []);
  
  const handleMainImageChange = (imageFile: ImageFile) => {
    setMainImageFile(imageFile);
    setValue("image", imageFile.url);
  };
  
  const handleAdditionalImagesChange = (imageFiles: ImageFile[]) => {
    setAdditionalImageFiles(prev => [...prev, ...imageFiles]);
    setValue("additionalImages", [
      ...watch("additionalImages", []),
      ...imageFiles.map(file => file.url)
    ]);
  };
  
  const handleRemoveAdditionalImage = (index: number) => {
    const updatedFiles = [...additionalImageFiles];
    updatedFiles.splice(index, 1);
    setAdditionalImageFiles(updatedFiles);
    
    const updatedUrls = [...watch("additionalImages", [])];
    updatedUrls.splice(index, 1);
    setValue("additionalImages", updatedUrls);
  };
  
  const addColor = (color: ProductColor) => {
    if (!watchColors.includes(color)) {
      setValue("colors", [...watchColors, color]);
    }
  };
  
  const removeColor = (color: ProductColor) => {
    setValue("colors", watchColors.filter(c => c !== color));
  };
  
  const addSize = (size: ProductSize) => {
    if (!watchSizes.includes(size)) {
      setValue("sizes", [...watchSizes, size]);
    }
  };
  
  const removeSize = (size: ProductSize) => {
    setValue("sizes", watchSizes.filter(s => s !== size));
  };
  
  const onFormSubmit = (data: ProductFormValues) => {
    onSubmit({
      ...data,
      mainImageFile: mainImageFile?.file,
      additionalImageFiles: additionalImageFiles.map(f => f.file).filter(Boolean) as File[],
    });
    
    // Show success toast after submitting
    toast.success(isEditing ? "Product updated!" : "Product added!", {
      description: isEditing 
        ? `${data.name} has been successfully updated` 
        : `${data.name} has been added to your inventory`,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 bg-mink/5 rounded-lg p-4 md:p-6 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Left column - Product details */}
        <div className="space-y-6">
          <div className="bg-mink/10 rounded-md p-4 border border-graphite/10">
            <h3 className="text-lg font-medium text-paper flex items-center border-b border-graphite/10 pb-2 mb-4">
              <span className="bg-accent/20 w-6 h-6 flex items-center justify-center rounded mr-2 text-accent">1</span>
              Product Details
            </h3>
          
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-paper flex items-center">
                  Product Name <span className="text-red-500 ml-1">*</span>
                  <span className="text-xs text-graphite/70 ml-auto">Required</span>
                </Label>
                <Input
                  id="name"
                  className="bg-transparent border-graphite/30 focus:border-accent/50 focus-within:ring-accent/30"
                  placeholder="Enter product name"
                  {...register("name", { required: "Product name is required" })}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <span className="bg-red-500/10 p-1 rounded-full mr-1">
                      <X className="w-3 h-3" />
                    </span>
                    {errors.name.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-paper flex items-center">
                    Price <span className="text-red-500 ml-1">*</span>
                    <span className="text-xs text-graphite/70 ml-auto">Required</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-graphite">$</span>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      className="bg-transparent border-graphite/30 focus:border-accent/50 pl-7 focus-within:ring-accent/30"
                      placeholder="0.00"
                      {...register("price", { 
                        required: "Price is required",
                        min: { value: 0, message: "Price must be positive" }
                      })}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <span className="bg-red-500/10 p-1 rounded-full mr-1">
                        <X className="w-3 h-3" />
                      </span>
                      {errors.price.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="compareAt" className="text-paper flex items-center">
                    Compare At Price
                    <span className="text-xs text-graphite/70 ml-auto">Optional</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-graphite">$</span>
                    <Input
                      id="compareAt"
                      type="number"
                      min="0"
                      step="0.01"
                      className="bg-transparent border-graphite/30 focus:border-accent/50 pl-7 focus-within:ring-accent/30"
                      placeholder="0.00"
                      {...register("compareAt")}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-paper flex items-center">
                  Description
                  <span className="text-xs text-graphite/70 ml-auto">Optional</span>
                </Label>
                <Textarea
                  id="description"
                  className="bg-transparent border-graphite/30 focus:border-accent/50 min-h-[100px] focus-within:ring-accent/30"
                  placeholder="Enter product description"
                  {...register("description")}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-paper flex items-center">
                    SKU
                    <span className="text-xs text-graphite/70 ml-auto">Optional</span>
                  </Label>
                  <Input
                    id="sku"
                    className="bg-transparent border-graphite/30 focus:border-accent/50 focus-within:ring-accent/30"
                    placeholder="SKU identifier"
                    {...register("sku")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-paper flex items-center">
                    Category <span className="text-red-500 ml-1">*</span>
                    <span className="text-xs text-graphite/70 ml-auto">Required</span>
                  </Label>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="bg-transparent border-graphite/30 focus:border-accent/50 focus-within:ring-accent/30">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <span className="bg-red-500/10 p-1 rounded-full mr-1">
                        <X className="w-3 h-3" />
                      </span>
                      {errors.category.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material" className="text-paper flex items-center">
                    Material
                    <span className="text-xs text-graphite/70 ml-auto">Optional</span>
                  </Label>
                  <Input
                    id="material"
                    className="bg-transparent border-graphite/30 focus:border-accent/50 focus-within:ring-accent/30"
                    placeholder="e.g., 100% Cotton"
                    {...register("material")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="care" className="text-paper flex items-center">
                    Care Instructions
                    <span className="text-xs text-graphite/70 ml-auto">Optional</span>
                  </Label>
                  <Input
                    id="care"
                    className="bg-transparent border-graphite/30 focus:border-accent/50 focus-within:ring-accent/30"
                    placeholder="e.g., Machine wash cold"
                    {...register("care")}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-mink/10 rounded-md p-4 border border-graphite/10">
            <h3 className="text-lg font-medium text-paper flex items-center border-b border-graphite/10 pb-2 mb-4">
              <span className="bg-accent/20 w-6 h-6 flex items-center justify-center rounded mr-2 text-accent">2</span>
              Options & Inventory
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-mink/5 rounded p-3 border border-graphite/10">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="in-stock" className="text-paper cursor-pointer">In Stock</Label>
                    <Controller
                      name="inStock"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="in-stock"
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div className="bg-mink/5 rounded p-3 border border-graphite/10">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-new" className="text-paper cursor-pointer">Mark as New</Label>
                    <Controller
                      name="isNew"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="is-new"
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div className="bg-mink/5 rounded p-3 border border-graphite/10">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-featured" className="text-paper cursor-pointer">Featured</Label>
                    <Controller
                      name="isFeatured"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="is-featured"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-paper flex items-center">
                    Colors
                    <span className="text-xs text-graphite/70 ml-auto">Recommended</span>
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] border border-dashed border-graphite/20 rounded-md p-2 bg-mink/5">
                    {watchColors.length === 0 && (
                      <p className="text-graphite/50 text-sm w-full text-center p-2">No colors selected</p>
                    )}
                    {watchColors.map((color) => (
                      <Badge
                        key={color}
                        variant="secondary"
                        className="flex items-center space-x-1 py-1.5 pr-1.5 bg-mink/10 hover:bg-mink/20 animate-fadeIn"
                      >
                        <span 
                          className="w-3 h-3 rounded-full mr-1"
                          style={{ 
                            backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : 
                                         color.toLowerCase() === 'black' ? '#000000' :
                                         color.toLowerCase() === 'navy' ? '#1e3a8a' :
                                         color.toLowerCase() === 'camel' ? '#c19a6b' :
                                         color.toLowerCase() === 'olive' ? '#556b2f' :
                                         color.toLowerCase() === 'grey' ? '#6b7280' :
                                         color.toLowerCase() === 'red' ? '#dc2626' :
                                         color.toLowerCase() === 'blue' ? '#2563eb' :
                                         color.toLowerCase() === 'brown' ? '#8b4513' :
                                         color.toLowerCase()
                          }}
                        />
                        <span>{color}</span>
                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                          className="ml-1 w-4 h-4 rounded-full bg-graphite/20 hover:bg-graphite/30 hover:text-red-400 flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Select onValueChange={addColor}>
                      <SelectTrigger className="bg-transparent border-graphite/30 focus:border-accent/50 w-full focus-within:ring-accent/30">
                        <SelectValue placeholder="Add color..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.filter(color => !watchColors.includes(color)).map(color => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center space-x-2">
                              <span 
                                className="w-3 h-3 rounded-full"
                                style={{ 
                                  backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : 
                                                 color.toLowerCase() === 'black' ? '#000000' :
                                                 color.toLowerCase() === 'navy' ? '#1e3a8a' :
                                                 color.toLowerCase() === 'camel' ? '#c19a6b' :
                                                 color.toLowerCase() === 'olive' ? '#556b2f' :
                                                 color.toLowerCase() === 'grey' ? '#6b7280' :
                                                 color.toLowerCase() === 'red' ? '#dc2626' :
                                                 color.toLowerCase() === 'blue' ? '#2563eb' :
                                                 color.toLowerCase() === 'brown' ? '#8b4513' :
                                                 color.toLowerCase()
                                }}
                              />
                              <span>{color}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!watchColors.length && (
                    <p className="text-amber-500 text-xs mt-1 flex items-center">
                      <span className="bg-amber-500/10 p-1 rounded-full mr-1">
                        <span className="text-amber-500">!</span>
                      </span>
                      At least one color is recommended
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-paper flex items-center">
                    Sizes
                    <span className="text-xs text-graphite/70 ml-auto">Recommended</span>
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] border border-dashed border-graphite/20 rounded-md p-2 bg-mink/5">
                    {watchSizes.length === 0 && (
                      <p className="text-graphite/50 text-sm w-full text-center p-2">No sizes selected</p>
                    )}
                    {watchSizes.map((size) => (
                      <Badge
                        key={size}
                        variant="secondary"
                        className="flex items-center space-x-1 py-1.5 pr-1.5 bg-mink/10 hover:bg-mink/20 animate-fadeIn"
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => removeSize(size)}
                          className="ml-1 w-4 h-4 rounded-full bg-graphite/20 hover:bg-graphite/30 hover:text-red-400 flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Select onValueChange={addSize}>
                      <SelectTrigger className="bg-transparent border-graphite/30 focus:border-accent/50 w-full focus-within:ring-accent/30">
                        <SelectValue placeholder="Add size..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZES.filter(size => !watchSizes.includes(size)).map(size => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!watchSizes.length && (
                    <p className="text-amber-500 text-xs mt-1 flex items-center">
                      <span className="bg-amber-500/10 p-1 rounded-full mr-1">
                        <span className="text-amber-500">!</span>
                      </span>
                      At least one size is recommended
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Images */}
        <div className="bg-mink/10 rounded-md p-4 border border-graphite/10">
          <h3 className="text-lg font-medium text-paper flex items-center border-b border-graphite/10 pb-2 mb-4">
            <span className="bg-accent/20 w-6 h-6 flex items-center justify-center rounded mr-2 text-accent">3</span>
            Product Images
          </h3>
          
          <PhotoUploader
            mainImage={mainImageFile?.url || product?.image}
            additionalImages={[
              ...(additionalImageFiles.map(f => f.url) || []),
              ...(product?.additionalImages || []).filter(url => 
                !additionalImageFiles.map(f => f.url).includes(url)
              )
            ]}
            onMainImageChange={handleMainImageChange}
            onAdditionalImagesChange={handleAdditionalImagesChange}
            onRemoveAdditionalImage={handleRemoveAdditionalImage}
          />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:justify-end gap-4 border-t border-graphite/20 pt-6">
        <Button 
          type="button" 
          variant="outline" 
          className="border-graphite/30 w-full sm:w-auto"
          onClick={() => navigate("/admin?tab=products")}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-accent text-ink hover:bg-accent/90 w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : isEditing ? "Save Changes" : "Add Product"}
        </Button>
      </div>
    </form>
  );
};
