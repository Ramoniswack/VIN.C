import { useEffect } from 'react';
import { gsap } from 'gsap';
import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { Marquee } from '@/components/Marquee';
import { FeaturedCollections } from '@/components/FeaturedCollections';
import { Footer } from '@/components/Footer';

const Index = () => {
  useEffect(() => {
    // Global GSAP settings for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.globalTimeline.timeScale(0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <main>
        <Hero />
        <Marquee />
        <FeaturedCollections />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
