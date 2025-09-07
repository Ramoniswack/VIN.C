import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Search, ShoppingBag, Menu, X, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const cartItemsCount = useCartStore(state => state.getTotalItems());
  
  // Check if we're on the home page (where hero image is)
  const isOnHomePage = location.pathname === '/';
  const isOverHero = isOnHomePage && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Function to scroll to top when clicking on the same link
  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (location.pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Animate navigation on mount
    gsap.fromTo('nav', 
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.2 }
    );
  }, []);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'Collections', href: '/collections' },
    { label: 'Lookbook', href: '/lookbook' },
    { label: 'Journal', href: '/journal' },
    { label: 'About', href: '/about' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ? 'bg-bg/90 backdrop-blur-md border-b border-graphite/30' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className={`font-display text-2xl font-medium tracking-tight transition-colors duration-300 ${
              isOverHero ? 'text-white' : 'text-paper'
            }`}>
              VIN.C
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`font-body relative group transition-colors duration-300 ${
                  isOverHero 
                    ? 'text-gray-200 hover:text-white' 
                    : 'text-mink hover:text-paper'
                }`}
                onClick={(e) => handleNavLinkClick(e, item.href)}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-accent-color transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className={`hover:bg-transparent transition-colors duration-300 ${
                isOverHero 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-mink hover:text-paper'
              }`}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Link
              to="/cart"
              className={`hover:bg-transparent relative p-2 transition-colors duration-300 ${
                isOverHero 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-mink hover:text-paper'
              }`}
              onClick={(e) => handleNavLinkClick(e, '/cart')}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-accent-color text-ink text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {cartItemsCount}
              </span>
            </Link>
            
            {/* Admin Link */}
            <Link
              to={isAuthenticated ? "/admin" : "/admin-login"}
              className={`hover:bg-transparent p-2 transition-colors duration-300 ${
                isOverHero 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-mink hover:text-paper'
              }`}
              onClick={(e) => handleNavLinkClick(e, isAuthenticated ? "/admin" : "/admin-login")}
            >
              <User className="h-5 w-5" />
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden hover:bg-transparent transition-colors duration-300 ${
                isOverHero 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-mink hover:text-paper'
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-6 pb-6 border-t border-graphite/30">
            <div className="flex flex-col space-y-4 mt-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`font-body py-2 transition-colors duration-300 ${
                    isOverHero 
                      ? 'text-gray-200 hover:text-white' 
                      : 'text-mink hover:text-paper'
                  }`}
                  onClick={(e) => {
                    handleNavLinkClick(e, item.href);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Admin Link for Mobile */}
              <Link
                to={isAuthenticated ? "/admin" : "/admin-login"}
                className={`font-body py-2 transition-colors duration-300 ${
                  isOverHero 
                    ? 'text-gray-200 hover:text-white' 
                    : 'text-mink hover:text-paper'
                }`}
                onClick={(e) => {
                  handleNavLinkClick(e, isAuthenticated ? "/admin" : "/admin-login");
                  setIsMobileMenuOpen(false);
                }}
              >
                Admin {isAuthenticated ? "Dashboard" : "Login"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};