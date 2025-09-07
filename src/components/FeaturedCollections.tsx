import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import lookbook1 from '@/assets/lookbook-1.jpg';
import lookbook2 from '@/assets/lookbook-2.jpg';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  featured?: boolean;
}

const collections: Collection[] = [
  {
    id: '1',
    name: 'Essential Minimalism',
    description: 'Timeless pieces crafted for the modern wardrobe. Clean lines, premium fabrics, impeccable tailoring.',
    image: lookbook1,
    featured: true
  },
  {
    id: '2',
    name: 'Atelier Heritage',
    description: 'Hand-finished garments that celebrate traditional craftsmanship with contemporary silhouettes.',
    image: lookbook2,
    featured: true
  }
];

export const FeaturedCollections = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        gsap.fromTo(card, 
          {
            opacity: 0,
            y: 60,
            scale: 0.95
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              end: "bottom 20%",
              toggleActions: "play none none reverse"
            },
            delay: index * 0.2
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl md:text-6xl text-paper font-medium tracking-tighter mb-6">
            Featured Collections
          </h2>
          <p className="font-body text-lg text-mink max-w-2xl mx-auto leading-relaxed">
            Discover our curated selection of limited-edition pieces, 
            each embodying the essence of quiet luxury and meticulous craftsmanship.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {collections.map((collection, index) => (
            <div
              key={collection.id}
              ref={el => {
                if (el) cardsRef.current[index] = el;
              }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg mb-8 aspect-[4/5]">
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              
              <div className="space-y-4">
                <h3 className="font-display text-2xl md:text-3xl text-paper font-medium tracking-tight">
                  {collection.name}
                </h3>
                <p className="font-body text-mink leading-relaxed">
                  {collection.description}
                </p>
                <Button 
                  variant="outline" 
                  className="border-graphite text-mink hover:bg-mink hover:text-ink transition-all duration-300"
                >
                  Explore Collection
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};