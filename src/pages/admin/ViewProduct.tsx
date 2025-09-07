import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductStore, Product } from "@/store/productStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, Star, Calendar, DollarSign, Package, Tag, Info, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

const ViewProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProduct } = useProductStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("details");

  useEffect(() => {
    if (id) {
      const foundProduct = getProduct(parseInt(id, 10));
      if (foundProduct) {
        setProduct(foundProduct);
        setActiveImage(foundProduct.image);
      } else {
        navigate("/admin");
      }
    }
  }, [id, getProduct, navigate]);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const formattedCreatedDate = format(new Date(product.createdAt), "PPP");
  const formattedUpdatedDate = format(new Date(product.updatedAt), "PPP");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2 p-2" 
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-display font-medium text-paper">
            Product Details
          </h1>
        </div>
        
        <Button 
          variant="outline"
          className="border-accent text-accent hover:bg-accent hover:text-ink" 
          onClick={() => navigate(`/admin/products/edit/${id}`)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Product
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Images */}
        <div className="lg:col-span-1 space-y-4">
          {/* Main image */}
          <div className="aspect-square rounded-lg overflow-hidden border border-graphite/30 bg-mink/5">
            <img 
              src={activeImage.startsWith('/') ? activeImage : `/${activeImage}`}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Image thumbnails */}
          <div className="grid grid-cols-4 gap-2">
            <div 
              className={`aspect-square rounded-md overflow-hidden border-2 cursor-pointer ${
                activeImage === product.image ? 'border-accent' : 'border-transparent hover:border-graphite/30'
              }`}
              onClick={() => setActiveImage(product.image)}
            >
              <img 
                src={product.image.startsWith('/') ? product.image : `/${product.image}`}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {product.additionalImages.map((image, index) => (
              <div 
                key={index}
                className={`aspect-square rounded-md overflow-hidden border-2 cursor-pointer ${
                  activeImage === image ? 'border-accent' : 'border-transparent hover:border-graphite/30'
                }`}
                onClick={() => setActiveImage(image)}
              >
                <img 
                  src={image.startsWith('/') ? image : `/${image}`}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Product information card */}
          <Card className="border-graphite/30 bg-transparent">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-paper">Product Status</h2>
                <Badge variant={product.inStock ? "default" : "destructive"} className={
                  product.inStock 
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-graphite">Featured</p>
                  <p className="text-paper">{product.isFeatured ? "Yes" : "No"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-graphite">New Badge</p>
                  <p className="text-paper">{product.isNew ? "Showing" : "Hidden"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-graphite">SKU</p>
                  <p className="text-paper">{product.sku || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-graphite">Rating</p>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
                    <p className="text-paper">{product.rating}</p>
                    <span className="text-graphite text-xs ml-1">({product.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-graphite/20" />

              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-graphite mr-2" />
                  <p className="text-sm">
                    <span className="text-graphite">Created:</span> 
                    <span className="text-paper ml-1">{formattedCreatedDate}</span>
                  </p>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-graphite mr-2" />
                  <p className="text-sm">
                    <span className="text-graphite">Updated:</span> 
                    <span className="text-paper ml-1">{formattedUpdatedDate}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Product Details */}
        <div className="lg:col-span-2">
          <Card className="border-graphite/30 bg-transparent">
            <CardContent className="p-6">
              {/* Product title and price */}
              <div className="space-y-2 mb-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-2xl font-display font-medium text-paper">{product.name}</h2>
                  <div className="text-right">
                    <div className="text-xl font-medium text-paper">${product.price.toLocaleString()}</div>
                    {product.compareAt && (
                      <div className="flex items-center">
                        <span className="text-sm text-graphite line-through mr-2">
                          ${product.compareAt.toLocaleString()}
                        </span>
                        <Badge variant="secondary" className="bg-accent/10 text-accent">
                          {Math.round((1 - product.price / product.compareAt) * 100)}% OFF
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-graphite/30 text-graphite">
                    {product.category}
                  </Badge>
                  {product.isNew && (
                    <Badge className="bg-accent/20 text-accent">NEW</Badge>
                  )}
                  {product.isFeatured && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tabs for different sections */}
              <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-6 bg-mink/5">
                  <TabsTrigger value="details" className="data-[state=active]:bg-accent data-[state=active]:text-ink">
                    <Info className="h-4 w-4 mr-2" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="attributes" className="data-[state=active]:bg-accent data-[state=active]:text-ink">
                    <Tag className="h-4 w-4 mr-2" />
                    Attributes
                  </TabsTrigger>
                  <TabsTrigger value="media" className="data-[state=active]:bg-accent data-[state=active]:text-ink">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Media
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-0">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-paper mb-2">Description</h3>
                      <p className="text-graphite">
                        {product.description || "No description provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-paper mb-2">Material</h3>
                        <p className="text-graphite">{product.material || "Not specified"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-paper mb-2">Care Instructions</h3>
                        <p className="text-graphite">{product.care || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="attributes" className="mt-0">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-paper mb-3">Available Sizes</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map(size => (
                          <Badge key={size} variant="outline" className="border-graphite/30">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-paper mb-3">Available Colors</h3>
                      <div className="flex flex-wrap gap-3">
                        {product.colors.map(color => (
                          <div key={color} className="flex items-center">
                            <div 
                              className="w-5 h-5 rounded-full mr-2 border border-graphite/30"
                              style={{ 
                                backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : 
                                              color.toLowerCase() === 'black' ? '#000000' :
                                              color.toLowerCase() === 'navy' ? '#1e3a8a' :
                                              color.toLowerCase() === 'camel' ? '#c19a6b' :
                                              color.toLowerCase() === 'olive' ? '#556b2f' :
                                              color.toLowerCase() === 'grey' ? '#6b7280' :
                                              color.toLowerCase() === 'brown' ? '#8b4513' :
                                              color.toLowerCase() === 'red' ? '#dc2626' :
                                              color.toLowerCase() === 'blue' ? '#2563eb' :
                                              color.toLowerCase()
                              }}
                            ></div>
                            <span className="text-graphite text-sm">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-paper mb-2">Price Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-graphite">Regular Price:</span>
                            <span className="text-paper">${product.price.toLocaleString()}</span>
                          </div>
                          {product.compareAt && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-graphite">Compare At:</span>
                                <span className="text-paper line-through">${product.compareAt.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-graphite">Discount:</span>
                                <span className="text-accent">
                                  {Math.round((1 - product.price / product.compareAt) * 100)}%
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-paper mb-2">Additional Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-graphite">SKU:</span>
                            <span className="text-paper">{product.sku || "Not set"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-graphite">Category:</span>
                            <span className="text-paper">{product.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="media" className="mt-0">
                  <div className="space-y-6">
                    <h3 className="text-sm font-medium text-paper mb-2">Product Images</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Main image */}
                      <div className="space-y-2">
                        <div className="aspect-square rounded-md overflow-hidden border border-graphite/30">
                          <img 
                            src={product.image.startsWith('/') ? product.image : `/${product.image}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-graphite text-center">Main Image</p>
                      </div>
                      
                      {/* Additional images */}
                      {product.additionalImages.map((image, index) => (
                        <div key={index} className="space-y-2">
                          <div className="aspect-square rounded-md overflow-hidden border border-graphite/30">
                            <img 
                              src={image.startsWith('/') ? image : `/${image}`}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-graphite text-center">Additional Image {index + 1}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-graphite/20 flex flex-wrap gap-3 justify-between">
                <Button 
                  variant="outline"
                  className="border-graphite/30" 
                  onClick={() => navigate("/admin")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent hover:text-ink" 
                    onClick={() => navigate(`/admin/products/edit/${id}`)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Product
                  </Button>
                  
                  <Button
                    onClick={() => window.open(`/product/${product.id}`, '_blank')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    View in Shop
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewProduct;
