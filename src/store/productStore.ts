import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviews'>) => Product;
  updateProduct: (id: number, product: Partial<Product>) => Product | undefined;
  deleteProduct: (id: number) => void;
  getProduct: (id: number) => Product | undefined;
  generateImageUrl: (file: File) => string;
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
      
      updateProduct: (id, updatedData) => {
        const product = get().products.find(p => p.id === id);
        if (!product) return undefined;
        
        const updatedProduct = {
          ...product,
          ...updatedData,
          updatedAt: new Date().toISOString()
        };
        
        set(state => ({
          products: state.products.map(p => 
            p.id === id ? updatedProduct : p
          )
        }));
        
        return updatedProduct;
      },
      
      deleteProduct: (id) => {
        set(state => ({
          products: state.products.filter(p => p.id !== id)
        }));
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
