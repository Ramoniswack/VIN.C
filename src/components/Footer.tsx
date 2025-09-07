import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-bg border-t border-graphite/30 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-display text-2xl font-medium text-paper mb-6 tracking-tight">
              VIN.C
            </h3>
            <p className="font-body text-mink leading-relaxed mb-6">
              Crafting Nepalese quiet luxury through meticulous attention to detail and 
              authentic artisanal craftsmanship.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-mink hover:text-accent-color hover:bg-transparent"
              >
                <Instagram className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-mink hover:text-accent-color hover:bg-transparent"
              >
                <Twitter className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-mink hover:text-accent-color hover:bg-transparent"
              >
                <Facebook className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-body font-medium text-paper mb-6">Shop</h4>
            <ul className="space-y-3">
              {['New Arrivals', 'Collections', 'Sale', 'Gift Cards'].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="font-body text-mink hover:text-paper transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-body font-medium text-paper mb-6">Support</h4>
            <ul className="space-y-3">
              {['Contact', 'Size Guide', 'Returns', 'Shipping', 'Care Guide'].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="font-body text-mink hover:text-paper transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-body font-medium text-paper mb-6">Stay Updated</h4>
            <p className="font-body text-mink mb-6 leading-relaxed">
              Subscribe to receive updates on new collections and exclusive access.
            </p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-transparent border-graphite text-paper placeholder:text-mink focus:border-accent-color"
              />
              <Button className="w-full bg-paper text-ink hover:bg-paper/90">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-graphite/30 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="font-body text-mink text-sm">
              © 2025 VIN.C. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {['Privacy Policy', 'Terms of Service', 'Accessibility'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="font-body text-mink hover:text-paper text-sm transition-colors duration-300"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};