import React, { useState, useEffect, useRef, MutableRefObject } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Search, ShoppingBag, Menu, X, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useProductStore, Product } from '@/store/productStore';

export default function Navigation(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  // UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const closeTimerRef = useRef<number | null>(null) as MutableRefObject<number | null>;
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);

  // typed selectors (avoid returning new objects)
  type NavUser = { username?: string; isAdmin?: boolean } | null;
  const user = useAuthStore((s) => s.user as unknown as NavUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartItemsCount = useCartStore((s) => s.items?.length || 0);
  const products = useProductStore((s) => s.products || [] as Product[]);

  // visual theme helpers
  // when the navbar is over the hero (top of home page), use a subtle dark bg
  const [isOverHero, setIsOverHero] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return location.pathname === '/' && window.scrollY < 80;
  });

  useEffect(() => {
    const onScroll = () => {
      if (location.pathname !== '/') {
        if (isOverHero) setIsOverHero(false);
        return;
      }
      const over = window.scrollY < 80;
      if (over !== isOverHero) setIsOverHero(over);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isOverHero, location.pathname]);

  // when over hero, use a fixed subtle black tint regardless of theme
  // (user requested the hero navbar not respond to dark mode)
  const navBgOnly = isOverHero ? 'bg-black/10' : 'bg-white dark:bg-[#0b0b0b]';
  const navBorder = isOverHero ? '' : 'border-b border-gray-100 dark:border-gray-800';
  const navTopBorder = isOverHero ? '' : 'border-t border-gray-50 dark:border-gray-900';

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'New', href: '/new' },
    { label: 'About', href: '/about' }
  ];

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean) as string[];

  const accountHref = isAuthenticated ? (user?.isAdmin ? '/admin' : '/dashboard') : '/auth';
  const accountAria = isAuthenticated ? (user?.isAdmin ? 'Open admin dashboard' : 'Open your dashboard') : 'Open account page';

  const handleNavLinkClick = (e: React.MouseEvent | undefined | null, href: string) => {
    e?.preventDefault?.();
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    navigate(href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = (searchQuery || '').trim();
    if (q) navigate(`/shop?q=${encodeURIComponent(q)}`);
    else navigate('/shop');
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsShopOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 60);
  }, [isSearchOpen]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${navBgOnly} ${navBorder}`}>
      <div className="w-full px-2 py-3">
        <div className="w-full grid grid-cols-3 items-center">

          {/* Left: mobile toggles + desktop links */}
          <div className="flex items-center space-x-2 col-start-1">
              <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <IconButton variant="ghost" size="icon" className="p-2" onClick={() => setIsMobileMenuOpen((s) => !s)} ariaLabel="Toggle menu">
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </IconButton>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                item.label === 'Shop' ? (
                  <div key={item.label} className="relative" onMouseEnter={() => { if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null; } setIsShopOpen(true); }} onMouseLeave={() => { if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current); closeTimerRef.current = window.setTimeout(() => { setIsShopOpen(false); closeTimerRef.current = null; }, 220); }}>
                    <Link to={item.href} style={{ fontFamily: 'Playfair Display, Bodoni Moda, serif' }} className={`text-base font-medium transition-colors duration-200 ${isOverHero ? 'text-white' : 'text-black dark:text-white'}`} onClick={(e) => handleNavLinkClick(e, item.href)}>{item.label}</Link>
                  </div>
                ) : (
                  <Link key={item.label} to={item.href} style={{ fontFamily: 'Playfair Display, Bodoni Moda, serif' }} className={`text-base font-medium ${isOverHero ? 'text-white' : 'text-black dark:text-white'}`} onClick={(e) => handleNavLinkClick(e, item.href)}>{item.label}</Link>
                )
              ))}
            </div>
          </div>

          {/* Center: brand */}
            <div className="col-start-2 justify-self-center">
            <Link to="/" style={{ fontFamily: 'Playfair Display, var(--font-display), serif' }} className={`text-2xl font-medium tracking-tight ${isOverHero ? 'text-white' : 'text-black dark:text-white'}`}>VIN.C</Link>
          </div>

          {/* Right: actions */}
            <div className="flex items-center space-x-3 justify-end col-start-3 pr-2">
            <div className="hidden md:flex"><ThemeToggle /></div>
            <IconButton variant="ghost" size="icon" ariaLabel="Search" onClick={() => setIsSearchOpen(true)} className="p-2">
              <Search className={`h-5 w-5 ${isOverHero ? 'text-white' : 'text-black dark:text-white'}`} />
            </IconButton>

            <Link to="/shop" className="hidden lg:inline-block">
        <Button size="sm" className="px-4 py-2 bg-[#D4AF37] text-black">Shop</Button>
            </Link>

            <Link to="/cart" className="relative p-2" onClick={(e) => handleNavLinkClick(e, '/cart')}>
              <ShoppingBag className={`h-5 w-5 ${isOverHero ? 'text-white' : 'text-black dark:text-white'}`} />
              <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">{cartItemsCount}</span>
            </Link>

            <Link to={accountHref} className="p-2" onClick={(e) => handleNavLinkClick(e, accountHref)} aria-label={accountAria}>
              <User className={`h-5 w-5 ${isOverHero ? 'text-white' : 'text-black dark:text-white'}`} />
            </Link>
          </div>
        </div>

        {/* Mega menu */}
        {isShopOpen && (
          <div className={`absolute left-0 right-0 top-full z-40 ${navBgOnly} ${navTopBorder}`} onMouseEnter={() => { if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null; } setIsShopOpen(true); }} onMouseLeave={() => { if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current); closeTimerRef.current = window.setTimeout(() => { setIsShopOpen(false); closeTimerRef.current = null; }, 220); }}>
        {/* make mega menu content start from left edge but nudged right slightly */}
          <div className="w-full pl-6 md:pl-8 py-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 text-sm md:text-base">
                {categories.map((cat) => (
                  <div key={cat} className="flex flex-col">
                    <h6 style={{ fontFamily: 'Playfair Display, Bodoni Moda, serif' }} className="text-sm md:text-base uppercase tracking-wide font-medium mb-2 text-black dark:text-white">{cat}</h6>
                    <ul className="space-y-2">
                      {products.filter(p => p.category === cat).slice(0,8).map((p) => (
                        <li key={p.id}><Link to={`/product/${p.id}`} style={{ fontFamily: 'Playfair Display, Bodoni Moda, serif' }} className="text-sm md:text-base text-black dark:text-white/90 hover:underline">{p.name}</Link></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu: centered modal-style with Playfair font for nav items */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)} />

            <div className="relative z-10 w-full max-w-sm mx-4">
              <div className="bg-white dark:bg-[#0b0b0b] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Link to="/" style={{ fontFamily: 'Playfair Display, Bodoni Moda, serif' }} className="text-2xl font-medium tracking-tight text-black dark:text-white">VIN.C</Link>
                    <IconButton variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} ariaLabel="Close menu">
                      <X className="h-5 w-5 text-black dark:text-white" />
                    </IconButton>
                  </div>

                  <nav className="flex flex-col space-y-4">
                    {navItems.map((item) => (
                      <Link key={item.label} to={item.href} style={{ fontFamily: 'Playfair Display, Bodoni Moda, serif' }} className="text-xl font-semibold text-black dark:text-white" onClick={(e) => { handleNavLinkClick(e, item.href); setIsMobileMenuOpen(false); }}>{item.label}</Link>
                    ))}

                    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                      <Link to={accountHref} className="block text-base text-black dark:text-white py-2" onClick={(e) => { handleNavLinkClick(e, accountHref); setIsMobileMenuOpen(false); }}>{isAuthenticated ? (user?.isAdmin ? 'Admin Dashboard' : 'Dashboard') : 'Login'}</Link>
                      <Link to="/cart" className="block text-base text-black dark:text-white py-2" onClick={() => setIsMobileMenuOpen(false)}>Cart ({cartItemsCount})</Link>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <form onSubmit={handleSearch} className="flex items-center gap-3">
                        <Input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="flex-1 bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-black dark:text-white" />
                        <Button type="submit" className="bg-[#D4AF37] text-black">Search</Button>
                      </form>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search panel (desktop) */}
        <div className={`fixed inset-0 z-40 transition-opacity duration-200 ${isSearchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <div ref={searchPanelRef} className={`absolute left-1/2 transform -translate-x-1/2 top-6 w-full max-w-4xl transition-transform duration-300 ${isSearchOpen ? 'translate-y-0' : '-translate-y-8'} z-50`}>
            <div className="bg-popover/95 border-b border-graphite/10 rounded-xl overflow-hidden">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <form onSubmit={handleSearch} className="flex items-center space-x-4" role="search" aria-label="Search products">
                  <Search className="h-5 w-5 text-graphite" />
                  <Input ref={searchInputRef} type="text" placeholder="Search Any Product" name="q" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0" />
                  <IconButton variant="ghost" size="icon" ariaLabel="Close search" onClick={() => setIsSearchOpen(false)}>
                    <X className="h-5 w-5" />
                  </IconButton>
                </form>
              </div>
            </div>
          </div>
        </div>

      </div>
    </nav>
  );
}