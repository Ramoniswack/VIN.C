import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Search, ShoppingBag, Menu, X, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const cartItemsCount = useCartStore(state => state.getTotalItems());
  const { products } = useProductStore();

  const isOnHomePage = location.pathname === '/';
  const isOverHero = isOnHomePage && !isScrolled;

  // compute nav background + border classes once so we can reuse for mega-menu
  const navBgOnly = isScrolled ? 'bg-bg/95' : (isOverHero ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent');
  const navBorder = isScrolled ? 'border-b border-graphite/20' : (isOverHero ? 'border-b border-black/10' : '');
  const navTopBorder = isScrolled ? 'border-t border-graphite/20' : (isOverHero ? 'border-t border-black/10' : 'border-t border-graphite/10');

  useEffect(() => {
    let ticking = false;
    const handle = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (location.pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Escape handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsShopOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [isSearchOpen]);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'New', href: '/new' },
    { label: 'About', href: '/about' }
  ];

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${navBgOnly} ${navBorder}`}>
      <div className="w-full px-2 py-2">
        <div className="w-full grid grid-cols-3 items-center">

          {/* Left area - on mobile show toggle + hamburger */}
          <div className="flex items-center space-x-2 justify-start col-start-1 pl-2">
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle className={`${isOverHero ? 'text-white' : 'text-mink'}`} />
              <Button variant="ghost" size="icon" className={`hover:bg-transparent transition-colors duration-300 ${isOverHero ? 'text-white hover:text-white' : 'text-mink hover:text-paper'}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>

            <div className="hidden md:flex items-center space-x-6 justify-start">
            {navItems.map((item) => (
              item.label === 'Shop' ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => { if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null; } setIsShopOpen(true); }}
                  onMouseLeave={() => { if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current); closeTimerRef.current = window.setTimeout(() => { setIsShopOpen(false); closeTimerRef.current = null; }, 220); }}
                  onFocus={() => { if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null; } setIsShopOpen(true); }}
                  onBlur={(e: React.FocusEvent) => { const related = e.relatedTarget as Node | null; if (!related || !e.currentTarget.contains(related)) { if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current); closeTimerRef.current = window.setTimeout(() => { setIsShopOpen(false); closeTimerRef.current = null; }, 220); } }}
                >
                  <Link to={item.href} className={`font-body text-base font-medium transition-colors duration-200 ${isOverHero ? 'text-white hover:text-white' : 'text-mink hover:text-paper'}`} onClick={(e) => handleNavLinkClick(e, item.href)}>{item.label}</Link>

                  {/* mega menu toggles handled globally; actual full-width panel is rendered below as a sibling to the nav grid */}
                </div>
              ) : (
                <Link key={item.label} to={item.href} className={`font-body text-base font-medium transition-colors duration-200 ${isOverHero ? 'text-white hover:text-white' : 'text-mink hover:text-paper'}`} onClick={(e) => handleNavLinkClick(e, item.href)}>{item.label}</Link>
              )
            ))}
          </div>

          </div>

          <div className="col-start-2 justify-self-center">
            <Link to="/" className={`font-display text-2xl font-medium tracking-tight transition-colors duration-300 ${isOverHero ? 'text-white' : 'text-paper'}`}>VIN.C</Link>
          </div>

          {/* Right area - search, shop, cart, user on all screens */}
          <div className="flex items-center space-x-4 justify-end col-start-3 pr-2">
            {/* Theme toggle visible on md+ only (mobile toggle remains on left) */}
            <div className="hidden md:flex">
              <ThemeToggle className={`${isOverHero ? 'text-white' : 'text-mink'}`} />
            </div>

            <Button variant="ghost" size="icon" aria-label="Open search" title="Search" className={`hover:bg-transparent transition-colors duration-300 ${isOverHero ? 'text-white hover:text-white' : 'text-mink hover:text-paper'}`} onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" aria-hidden="true" />
            </Button>

            <Link to="/shop" className="hidden lg:inline-block ml-2">
              <Button size="sm" className={`px-4 py-2 font-medium tracking-tight transition-all duration-200 ${isOverHero ? 'bg-paper text-ink' : 'bg-accent-color text-ink'}`}>Shop</Button>
            </Link>

            <Link to="/cart" className={`hover:bg-transparent relative p-2 transition-colors duration-300 ${isOverHero ? 'text-white hover:text-white' : 'text-mink hover:text-paper'}`} onClick={(e) => handleNavLinkClick(e, '/cart')}>
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-accent-color text-ink text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">{cartItemsCount}</span>
            </Link>

            <Link to={isAuthenticated ? "/admin" : "/auth"} className={`hover:bg-transparent p-2 transition-colors duration-300 ${isOverHero ? 'text-white hover:text-white' : 'text-mink hover:text-paper'}`} onClick={(e) => handleNavLinkClick(e, isAuthenticated ? "/admin" : "/auth")} aria-label={isAuthenticated ? 'Open admin dashboard' : 'Open account page'}>
              <User className="h-5 w-5" />
            </Link>

            {/* on mobile toggle/hamburger already in left area */}
          </div>
        </div>

        {/* Full-width mega-menu anchored to the left edge of the screen */}
        {isShopOpen && (
          <div
            className="absolute left-0 right-0 top-full z-40"
            onMouseEnter={() => { if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null; } setIsShopOpen(true); }}
            onMouseLeave={() => { if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current); closeTimerRef.current = window.setTimeout(() => { setIsShopOpen(false); closeTimerRef.current = null; }, 220); }}
          >
            {/* mega-menu background matches navbar */}
            <div className={`w-full ${navBgOnly} ${navTopBorder}`}>
              {/* content starts from the left edge; no centered max-width so columns begin near the left */}
              <div className="w-full px-4 md:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 md:gap-8 text-sm md:text-base lg:text-base">
                  {categories.map((cat) => (
                    <div key={cat} className="flex flex-col">
                      <h6 className="text-sm md:text-base uppercase tracking-wide font-medium mb-2 text-black dark:text-white">{cat}</h6>
                      <ul className="space-y-2">
                        {products.filter(p => p.category === cat).slice(0,8).map(p => (
                          <li key={p.id}><Link to={`/product/${p.id}`} className="text-sm md:text-base text-black/85 dark:text-gray-200 hover:underline font-normal">{p.name}</Link></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isMobileMenuOpen && (
          <div className="md:hidden mt-6 pb-6 border-t border-graphite/30">
            <div className="flex flex-col space-y-4 mt-6">
              {navItems.map((item) => (
                <Link key={item.label} to={item.href} className={`font-body py-2 transition-colors duration-300 ${isOverHero ? 'text-gray-200 hover:text-white' : 'text-mink hover:text-paper'}`} onClick={(e) => { handleNavLinkClick(e, item.href); setIsMobileMenuOpen(false); }}>{item.label}</Link>
              ))}

              <Link to={isAuthenticated ? "/admin" : "/admin-login"} className={`font-body py-2 transition-colors duration-300 ${isOverHero ? 'text-gray-200 hover:text-white' : 'text-mink hover:text-paper'}`} onClick={(e) => { handleNavLinkClick(e, isAuthenticated ? "/admin" : "/admin-login"); setIsMobileMenuOpen(false); }}>
                Admin {isAuthenticated ? "Dashboard" : "Login"}
              </Link>
            </div>
          </div>
        )}

        <div className={`fixed inset-0 z-40 transition-opacity duration-200 ${isSearchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
          <div ref={searchPanelRef} className={`absolute left-1/2 transform -translate-x-1/2 top-6 w-full max-w-4xl transition-transform duration-300 ${isSearchOpen ? 'translate-y-0' : '-translate-y-8'} z-50`}>
            <div className="top-search-panel bg-popover/95 border-b border-graphite/10 rounded-xl overflow-hidden">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <form onSubmit={handleSearch} className="flex items-center space-x-4" role="search" aria-label="Search products">
                  <Search className="h-5 w-5 text-graphite" />
                  <Input ref={searchInputRef} type="text" placeholder="Search Any Product" name="q" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0" />
                  <Button variant="ghost" size="icon" aria-label="Close search" onClick={() => setIsSearchOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

      </div>
    </nav>
  );
};