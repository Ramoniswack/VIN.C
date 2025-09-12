import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, ShoppingBag, Heart, Star } from 'lucide-react';
import { useProductStore } from '@/store/productStore';

const NewPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const { products: storeProducts } = useProductStore();

  // only show new products by default
  const newProducts = storeProducts.filter(p => p.isNew || p.isFeatured).slice();

  const filteredProducts = useMemo(() => {
    let filtered = newProducts.slice();
    // search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
    }

    // apply selectedFilters (size, color, category, price)
    if (selectedFilters.size?.length) {
      filtered = filtered.filter(product =>
        selectedFilters.size.some(size => product.sizes?.includes(size as any))
      );
    }

    if (selectedFilters.color?.length) {
      filtered = filtered.filter(product =>
        selectedFilters.color.some(color => product.colors?.includes(color as any))
      );
    }

    if (selectedFilters.category?.length) {
      filtered = filtered.filter(product =>
        selectedFilters.category.includes(product.category as any)
      );
    }

    if (selectedFilters.price?.length) {
      filtered = filtered.filter(product => {
        return selectedFilters.price.some(range => {
          if (range === '0-500') return product.price < 500;
          if (range === '500-1000') return product.price >= 500 && product.price < 1000;
          if (range === '1000-2000') return product.price >= 1000 && product.price < 2000;
          if (range === '2000+') return product.price >= 2000;
          return false;
        });
      });
    }

    // sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return filtered;
  }, [newProducts, searchQuery, sortBy, selectedFilters]);

  const toggleFilter = (category: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category]?.includes(value) ? prev[category].filter((item) => item !== value) : [...(prev[category] || []), value]
    }));
  };

  const clearFilters = () => setSelectedFilters({});

  const filters = {
    size: ['XS','S','M','L','XL','XXL'],
    color: ['Black','White','Navy','Camel','Olive','Grey','Red','Blue','Brown'],
    category: ['Blazers','Trousers','Shirts','Outerwear','Accessories','Sets'],
    price: [
      { label: 'Under $500', value: '0-500' },
      { label: '$500-$1000', value: '500-1000' },
      { label: '$1000-$2000', value: '1000-2000' },
      { label: 'Over $2000', value: '2000+' }
    ]
  } as const;

  const FilterSection = ({ title, items, category }: { title: string; items: Array<string | {label:string;value:string}>; category: string }) => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-paper uppercase tracking-wide">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const value = typeof item === 'string' ? item : item.value;
          const label = typeof item === 'string' ? item : item.label;
          const isSelected = selectedFilters[category]?.includes(value);
          return (
            <label key={value} className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" checked={isSelected} onChange={() => toggleFilter(category, value)} className="sr-only" />
                <div className={`w-4 h-4 border-2 rounded transition-all duration-200 ${isSelected ? 'bg-accent border-accent' : 'border-graphite/40 group-hover:border-accent/60'}`}>
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-ink absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 8 8">
                      <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-paper group-hover:text-accent transition-colors">{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  const ProductCard = ({ product }: any) => (
    <Card className="group cursor-pointer border-graphite/20 bg-transparent hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-graphite/10" onClick={() => window.location.href = `/product/${product.id}`}>
      <CardContent className="p-0 relative">
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {product.isNew && (<Badge className="bg-accent text-ink font-medium text-xs px-2 py-1">NEW</Badge>)}
          {product.compareAt && (<Badge variant="destructive" className="bg-red-600 text-white font-medium text-xs px-2 py-1">SALE</Badge>)}
        </div>

        <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 h-8 w-8 bg-bg/80 backdrop-blur-sm hover:bg-bg text-graphite hover:text-accent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Heart className="h-4 w-4" />
        </Button>

        <div className="aspect-[4/5] overflow-hidden bg-mink/10 relative">
          <img src={product.image.startsWith('/') ? product.image : `/${product.image}`} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
          {!product.inStock && (
            <div className="absolute inset-0 bg-graphite/50 flex items-center justify-center">
              <Badge variant="secondary" className="bg-bg text-graphite font-medium">Out of Stock</Badge>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            <Button className="w-full bg-accent text-ink hover:bg-accent/90 font-medium" disabled={!product.inStock}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              {product.inStock ? 'Quick Add' : 'Notify Me'}
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <div className="space-y-1">
            <h3 className="font-medium text-paper group-hover:text-accent transition-colors leading-tight">{product.name}</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-graphite">{product.rating}</span>
              </div>
              <span className="text-xs text-graphite">({product.reviews})</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-lg font-medium text-paper">${product.price.toLocaleString()}</span>
            {product.compareAt && <span className="text-sm text-graphite line-through">${product.compareAt.toLocaleString()}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-display font-medium text-paper mb-2 tracking-tight">New Arrivals</h1>
            <p className="text-lg text-graphite max-w-md">Hand-picked fresh pieces added recently. Shop the latest.</p>
            <div className="flex items-center space-x-6 text-sm text-graphite pt-2">
              <span>{filteredProducts.length} Products</span>
              <span>•</span>
              <span>Free Shipping Over $500</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6 lg:mt-0">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-graphite dark:text-paper" />
              <Input
                placeholder="Search new arrivals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 bg-transparent border-graphite/30 dark:border-graphite/30 text-graphite dark:text-paper focus:border-accent/50 transition-colors"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-transparent border border-graphite/30 dark:border-graphite/30 rounded-md text-graphite dark:text-paper text-sm focus:border-accent/50 focus:outline-none transition-colors min-w-[180px]"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-center border-graphite/30 hover:border-accent/50">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters & Sort
                  {Object.keys(selectedFilters).length > 0 && (
                    <span className="ml-2 bg-accent text-ink px-2 py-0.5 text-xs rounded">{Object.values(selectedFilters).flat().length}</span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-bg border-graphite/20">
                <SheetHeader>
                  <SheetTitle className="text-paper text-lg">Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6 px-4">
                  <FilterSection title="Size" items={filters.size} category="size" />
                  <FilterSection title="Color" items={filters.color} category="color" />
                  <FilterSection title="Category" items={filters.category} category="category" />
                  <FilterSection title="Price Range" items={filters.price} category="price" />
                  <div className="pt-4 border-t border-graphite/20">
                    <Button onClick={clearFilters} variant="outline" className="w-full border-graphite/30">
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <aside className="hidden lg:block w-72 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-paper">Filters</h2>
              <Button onClick={clearFilters} variant="ghost" size="sm" className="text-graphite hover:text-accent">Clear All</Button>
            </div>
            <div className="space-y-8">
              <FilterSection title="Size" items={filters.size} category="size" />
              <FilterSection title="Color" items={filters.color} category="color" />
              <FilterSection title="Category" items={filters.category} category="category" />
              <FilterSection title="Price Range" items={filters.price} category="price" />
            </div>

            {/* Filter Summary */}
            {Object.keys(selectedFilters).length > 0 && (
              <div className="p-4 border border-graphite/20 rounded-lg bg-mink/5">
                <h3 className="text-sm font-medium text-paper mb-3">Active Filters</h3>
                <div className="space-y-2">
                  {Object.entries(selectedFilters).map(([category, values]) =>
                    values.map((value) => (
                      <button
                        key={`${category}-${value}`}
                        className="inline-flex items-center mr-2 mb-1 bg-bg border border-graphite/20 rounded px-2 py-1 text-sm text-graphite hover:bg-accent hover:text-ink transition-colors"
                        onClick={() => toggleFilter(category, value)}
                      >
                        {value} ×
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
              ) : (
                <div className="col-span-full py-12 text-center">
                  <div className="text-graphite text-xl mb-4">No new products found</div>
                  <p className="text-sm text-graphite/60 max-w-md mx-auto">Try adjusting your search or come back later.</p>
                </div>
              )}
            </div>

            {filteredProducts.length > 0 && (
              <div className="flex justify-center mt-12">
                <Button variant="outline" className="px-8 py-3 border-graphite/30 hover:border-accent/50">Load More Products</Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewPage;
