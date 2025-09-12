import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { Marquee } from '@/components/Marquee';
import { FeaturedCollections } from '@/components/FeaturedCollections';
import { Footer } from '@/components/Footer';
import { useProductStore } from '@/store/productStore';

const Index = () => {
  // Keep index lightweight; avoid global GSAP to reduce initial JS work
  const products = useProductStore(state => state.products);
  const [filter, setFilter] = useState<'all' | 'new' | 'trending'>('all');

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'new') return p.isNew;
    if (filter === 'trending') return p.isFeatured || p.rating >= 4.75;
    return true;
  }).slice(0, 6);

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <main>
        <Hero />
        <Marquee />
        <FeaturedCollections />
        {/* Premium Shop Now section (below featured collections) */}
        <section className="w-full max-w-8xl mx-auto px-4 py-24">
          <div className="text-center">
            <h2 className="text-7xl md:text-8xl lg:text-9xl font-display font-extrabold tracking-tight text-paper leading-tight">SHOP NOW</h2>
            <div className="mt-6 flex items-center justify-center space-x-4">
              <button onClick={() => setFilter('new')} className={`px-6 py-3 rounded-sm text-sm tracking-wider ${filter === 'new' ? 'bg-accent-color text-ink' : 'bg-paper text-ink border border-graphite/10'}`}>NEW ARRIVALS</button>
              <button onClick={() => setFilter('trending')} className={`px-6 py-3 rounded-sm text-sm tracking-wider ${filter === 'trending' ? 'bg-accent-color text-ink' : 'bg-paper text-ink border border-graphite/10'}`}>TRENDINGS</button>
            </div>

            {/* Premium product tiles, styled like FeaturedCollections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 mt-12 px-4 lg:px-0">
              {filteredProducts.map(p => (
                <div key={p.id} className="group cursor-pointer bg-card rounded-lg overflow-hidden">
                  <a href={`/product/${p.id}`} className="block">
                    <div className="relative overflow-hidden bg-[#e9e9e9] aspect-[4/5]">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-xl md:text-2xl text-paper font-medium tracking-tight mb-2">{p.name}</h3>
                      <p className="text-mink text-lg font-semibold">${p.price}</p>
                    </div>
                  </a>
                </div>
              ))}
            </div>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
