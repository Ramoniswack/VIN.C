import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const lookbookStories = [
  {
    id: 1,
    title: "Quiet Luxury",
    subtitle: "Autumn/Winter 2024",
    description: "An exploration of understated elegance through carefully curated silhouettes and premium materials.",
    coverImage: "/Products/ZenkageJack.jpg",
    images: [
      { url: "/Products/ZenkageJack.jpg", caption: "Zenkage Jacket in premium fabric" },
      { url: "/Products/ZenkageJack2.jpg", caption: "Detailed craftsmanship and fit" },
      { url: "/Products/ZenkageJack3.jpg", caption: "Complete look with refined details" },
      { url: "/Products/WhiteJack.jpg", caption: "Essential white jacket for versatility" }
    ]
  },
  {
    id: 2,
    title: "Modern Minimalism",
    subtitle: "Spring/Summer 2024",
    description: "Clean lines and refined details define this collection of contemporary essentials.",
    coverImage: "/Products/MoccaShirt.jpg",
    images: [
      { url: "/Products/MoccaShirt.jpg", caption: "Mocca shirt in natural tones" },
      { url: "/Products/MoccaShirt2.jpg", caption: "Modern cut with traditional techniques" },
      { url: "/Products/RegalChinos.jpg", caption: "Regal chinos for everyday elegance" },
      { url: "/Products/RegalChinos2.jpg", caption: "Perfect fit and comfort" }
    ]
  },
  {
    id: 3,
    title: "Urban Sophistication",
    subtitle: "Resort 2024",
    description: "Versatile pieces that transition seamlessly from city to destination.",
    coverImage: "/Products/CamoJack.jpg",
    images: [
      { url: "/Products/CamoJack.jpg", caption: "Camo jacket for urban exploration" },
      { url: "/Products/CamoJack2.jpg", caption: "Multi-functional design" },
      { url: "/Products/CamoJack3.jpg", caption: "Travel-ready sophistication" },
      { url: "/Products/Noragi.jpg", caption: "Noragi style for contemporary wear" }
    ]
  }
];

export default function Lookbook() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Header animation
    gsap.fromTo('.lookbook-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
    gsap.fromTo('.lookbook-desc', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.15 });

    // Story cards staggered animation
    gsap.fromTo('.lookbook-card', { opacity: 0, y: 20 }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: '.lookbook-card',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });

    // Featured editorial animation
    gsap.fromTo('.featured-editorial', { opacity: 0, y: 30 }, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.featured-editorial',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  const [selectedStory, setSelectedStory] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openStory = (storyId: number) => {
    setSelectedStory(storyId);
    setCurrentImageIndex(0);
  };

  const closeStory = () => {
    setSelectedStory(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    const story = lookbookStories.find(s => s.id === selectedStory);
    if (story) {
      setCurrentImageIndex((prev) => (prev + 1) % story.images.length);
    }
  };

  const prevImage = () => {
    const story = lookbookStories.find(s => s.id === selectedStory);
    if (story) {
      setCurrentImageIndex((prev) => (prev - 1 + story.images.length) % story.images.length);
    }
  };

  const currentStory = lookbookStories.find(s => s.id === selectedStory);

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      
      <main className="pt-24">
        {/* Header */}
        <div className="container mx-auto px-4 mb-12">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-display font-medium text-paper mb-4 lookbook-title">Lookbook</h1>
            <p className="text-xl text-graphite leading-relaxed lookbook-desc">
              Visual narratives that capture the essence of each collection through 
              carefully curated styling and editorial photography.
            </p>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {lookbookStories.map((story, index) => (
              <div
                key={story.id}
                className="group cursor-pointer lookbook-card"
                onClick={() => openStory(story.id)}
              >
                <div className="aspect-[4/5] overflow-hidden bg-mink/10 mb-4">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-medium text-paper group-hover:text-accent transition-colors">
                    {story.title}
                  </h2>
                  <p className="text-sm text-accent font-medium tracking-wide uppercase">
                    {story.subtitle}
                  </p>
                  <p className="text-graphite leading-relaxed">
                    {story.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Editorial */}
        <section className="bg-paper py-16 featured-editorial">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-display font-medium text-ink">
                  Behind the Atelier
                </h2>
                <p className="text-lg text-ink/80 leading-relaxed">
                  Each piece in our collection is the result of meticulous craftsmanship 
                  and thoughtful design. From initial sketch to final fitting, we document 
                  the journey of creating garments that stand the test of time.
                </p>
                <Button className="bg-accent hover:bg-accent/90 text-paper hero-button" asChild>
                  <Link to="/about" className="px-3 py-2 block">Explore Our Process</Link>
                </Button>
              </div>
              <div className="aspect-[4/3] overflow-hidden bg-mink">
                <img
                  src="/Products/MoccaCombo.png"
                  alt="VIN.C Kathmandu atelier workspace"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Full-Screen Story Modal */}
      {selectedStory && currentStory && (
        <div className="fixed inset-0 bg-bg z-50 flex items-center justify-center">
          <Button
            onClick={closeStory}
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 z-10 text-paper hover:text-accent"
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="flex items-center justify-center w-full h-full relative">
            <Button
              onClick={prevImage}
              variant="ghost"
              size="icon"
              className="absolute left-6 z-10 text-paper hover:text-accent"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            <div className="max-w-4xl max-h-[90vh] flex flex-col items-center">
              <div className="aspect-[4/5] max-h-[80vh] overflow-hidden">
                <img
                  src={currentStory.images[currentImageIndex].url}
                  alt={currentStory.images[currentImageIndex].caption}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="mt-6 text-center max-w-md">
                <h3 className="text-xl font-display font-medium text-paper mb-2">
                  {currentStory.title}
                </h3>
                <p className="text-graphite">
                  {currentStory.images[currentImageIndex].caption}
                </p>
                <div className="flex justify-center mt-4 space-x-1">
                  {currentStory.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-accent' : 'bg-graphite/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={nextImage}
              variant="ghost"
              size="icon"
              className="absolute right-6 z-10 text-paper hover:text-accent"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}