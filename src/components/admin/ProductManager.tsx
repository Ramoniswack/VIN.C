import { useState, useEffect } from "react";
import { toast } from 'sonner';
import { useProductStore, Product } from "@/store/productStore";
import { Button, IconButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  MoreHorizontal, 
  Eye, 
  Check, 
  Ban,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ProductManager = () => {
  const { products, deleteProduct, updateProduct, loadProducts, page, pageSize, total } = useProductStore();
  const itemsPerPage = pageSize || 10;
  // Ensure we sync with server on mount so admin actions operate on real server records
  // (avoids operating on the local seeded products stored in localStorage)
  useEffect(() => {
    (async () => {
      try {
        await loadProducts(1, itemsPerPage)
      } catch (e) {
        // ignore load errors - admin UI will still function with local data
        console.warn('failed to load products on admin mount', e)
      }
    })()
  }, [loadProducts, itemsPerPage])
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const navigate = useNavigate();
  
  // Get unique categories from products
  const categories = Array.from(new Set(products.map(product => product.category)));
  
  // Filter and sort products (client-side filtering applied to the current page set)
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (product.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-high":
          return b.price - a.price;
        case "price-low":
          return a.price - b.price;
        default:
          return 0;
      }
    });
  
  // For admin, rely on server-side pagination: products contains the current page slice
  const totalPages = total ? Math.ceil((total || 0) / itemsPerPage) : 1;
  const paginatedProducts = filteredProducts; // store.products already holds the current page
  
  const handleEditProduct = (id: number) => {
  navigate(`/admin/products/${id}/edit`);
  };
  
  const handleDeleteClick = (id: number) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Reload when page or itemsPerPage changes
  useEffect(() => {
    (async () => {
      try {
        await loadProducts(currentPage, itemsPerPage)
      } catch (e) {
        console.warn('failed to load products for page', currentPage, e)
      }
    })()
  }, [loadProducts, currentPage, itemsPerPage])
  
  const confirmDelete = () => {
    if (productToDelete) {
      (async () => {
        try {
          await deleteProduct(productToDelete);
          toast.success('Product deleted')
        } catch (e) {
          console.error('delete failed', e)
        }
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
      })()
    }
  };
  
  const handleToggleStatus = (id: number, inStock: boolean) => {
    (async () => {
      try { await updateProduct(id, { inStock: !inStock }) } catch (e) { console.error('update failed', e) }
    })()
  };
  
  const handleToggleFeatured = (id: number, isFeatured: boolean) => {
    (async () => {
      try { await updateProduct(id, { isFeatured: !isFeatured }) } catch (e) { console.error('update failed', e) }
    })()
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-medium text-paper">Products</h1>
        <Button 
          className="bg-accent text-ink hover:bg-accent/90"
          onClick={() => navigate("/admin/products/new")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 w-full md:max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-graphite" />
          <Input
            placeholder="Search products..."
            className="pl-10 bg-transparent border-graphite/30 focus:border-accent/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-graphite" />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="bg-transparent border-graphite/30 focus:border-accent/50 w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger className="bg-transparent border-graphite/30 focus:border-accent/50 w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="price-high">Price High-Low</SelectItem>
              <SelectItem value="price-low">Price Low-High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Products Table - Desktop */}
      <div className="rounded-md border border-graphite/30 overflow-hidden hidden md:block">
        <Table>
          <TableHeader className="bg-mink/5">
            <TableRow className="hover:bg-transparent border-graphite/20">
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product) => (
              <TableRow key={product.id} className="hover:bg-mink/5 border-graphite/20">
                <TableCell className="py-2">
                  <div className="w-12 h-12 rounded overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium text-paper">
                  {product.name}
                  {product.isNew && (
                    <Badge variant="secondary" className="ml-2 bg-accent/20 text-accent text-xs">
                      NEW
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">${product.price.toLocaleString()}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={product.inStock ? "default" : "destructive"}
                    className={`px-2 py-0.5 ${
                      product.inStock 
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                    onClick={() => handleToggleStatus(product.id, product.inStock)}
                  >
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <IconButton
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 rounded-full ${
                        product.isFeatured ? "text-yellow-500" : "text-graphite"
                      }`}
                      onClick={() => handleToggleFeatured(product.id, product.isFeatured)}
                    >
                      {product.isFeatured ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                    </IconButton>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                      <IconButton variant="ghost" size="icon" className="h-8 w-8 text-graphite hover:text-paper">
                        <MoreHorizontal className="h-4 w-4" />
                      </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        <span>View</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => handleEditProduct(product.id)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-500 focus:text-red-500"
                        onClick={() => handleDeleteClick(product.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            
            {paginatedProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-graphite">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Mobile Product Cards */}
      <div className="md:hidden space-y-4">
        {paginatedProducts.map((product) => (
          <div 
            key={product.id} 
            className="border border-graphite/30 rounded-md p-4 space-y-3 hover:bg-mink/5"
          >
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-paper truncate mr-2">{product.name}</h3>
                  <span className="font-medium text-paper">${product.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-graphite">{product.category}</span>
                  {product.isNew && (
                    <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">
                      NEW
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-graphite/10">
              <div className="flex items-center space-x-2">
                <Badge
                  variant={product.inStock ? "default" : "destructive"}
                  className={`px-2 py-0.5 ${
                    product.inStock 
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                  onClick={() => handleToggleStatus(product.id, product.inStock)}
                >
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
                
                <IconButton
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 rounded-full ${
                    product.isFeatured ? "text-yellow-500" : "text-graphite"
                  }`}
                  onClick={() => handleToggleFeatured(product.id, product.isFeatured)}
                >
                  {product.isFeatured ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                </IconButton>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-graphite hover:text-paper"
                  onClick={() => navigate(`/admin/products/${product.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-graphite hover:text-paper"
                  onClick={() => handleEditProduct(product.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-red-400 hover:text-red-600"
                  onClick={() => handleDeleteClick(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {paginatedProducts.length === 0 && (
          <div className="text-center py-8 text-graphite border border-graphite/30 rounded-md">
            No products found
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-graphite">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </span>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 p-0 border-graphite/30"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              // Show only a few page numbers and hide the rest with ellipsis
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === currentPage ? "default" : "outline"}
                    size="icon"
                    className={`w-8 h-8 p-0 ${
                      pageNumber === currentPage 
                        ? "bg-accent text-ink" 
                        : "border-graphite/30"
                    }`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              } else if (
                (pageNumber === currentPage - 2 && pageNumber > 1) ||
                (pageNumber === currentPage + 2 && pageNumber < totalPages)
              ) {
                return (
                  <Button
                    key={pageNumber}
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 p-0 border-none"
                    disabled
                  >
                    ...
                  </Button>
                );
              }
              return null;
            })}
            
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 p-0 border-graphite/30"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-bg border-graphite/30 text-paper">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-graphite">
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-graphite/30"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
