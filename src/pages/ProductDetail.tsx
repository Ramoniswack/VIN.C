import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Minus, Plus, Heart, Share2, Truck, RotateCcw, Shield } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useProductStore, Product } from "@/store/productStore";

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
  
  // Get product from store
  const product = getProduct(Number(productId));
  
  // Get related products (same category but different product)
  const relatedProducts = products
    .filter(p => p.id !== Number(productId) && p.category === product?.category)
    .slice(0, 3);
    
  // Set default color when product loads
  useEffect(() => {
    if (product && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);
  
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
    
  const isInStock = selectedVariant ? product.inStock && selectedVariant.inventory > 0 : false;
  
  const availableSizes = selectedColor ?
    variants
      .filter(v => v.color === selectedColor && v.inventory > 0)
      .map(v => v.size) :
    [];

  const handleAddToCart = () => {
    if (selectedVariant && isInStock && selectedColor) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        variant: {
          size: selectedSize,
          color: selectedColor,
          sku: selectedVariant.sku
        },
        quantity
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-[4/5] overflow-hidden bg-mink/10">
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
                {product.colors.map((color) => (
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
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-sm font-medium text-paper mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
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
                })}
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
                disabled={!selectedSize || !isInStock}
                className="w-full h-12 text-base"
              >
                {!selectedSize ? 'Select Size' : !isInStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsWishlisted(!isWishlisted)}
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