import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const lookbookStories = [
  {
    id: 1,
    title: "Quiet Luxury",
    subtitle: "Autumn/Winter 2024",
    description: "An exploration of understated elegance through carefully curated silhouettes and premium materials.",
    coverImage: "/api/placeholder/800/1000",
    images: [
      { url: "/api/placeholder/800/1000", caption: "Essential wool blazer in charcoal" },
      { url: "/api/placeholder/800/1000", caption: "Silk charmeuse shirt with tailored trousers" },
      { url: "/api/placeholder/800/1000", caption: "Cashmere overcoat in camel" },
      { url: "/api/placeholder/800/1000", caption: "Complete look with leather accessories" }
    ]
  },
  {
    id: 2,
    title: "Modern Minimalism",
    subtitle: "Spring/Summer 2024",
    description: "Clean lines and refined details define this collection of contemporary essentials.",
    coverImage: "/api/placeholder/800/1000",
    images: [
      { url: "/api/placeholder/800/1000", caption: "Linen blazer in natural tones" },
      { url: "/api/placeholder/800/1000", caption: "Cotton shirting with modern cut" },
      { url: "/api/placeholder/800/1000", caption: "Lightweight wool suiting" },
      { url: "/api/placeholder/800/1000", caption: "Seasonal accessories in leather" }
    ]
  },
  {
    id: 3,
    title: "Urban Sophistication",
    subtitle: "Resort 2024",
    description: "Versatile pieces that transition seamlessly from city to destination.",
    coverImage: "/api/placeholder/800/1000",
    images: [
      { url: "/api/placeholder/800/1000", caption: "Unstructured blazer in navy" },
      { url: "/api/placeholder/800/1000", caption: "Travel-friendly shirting" },
      { url: "/api/placeholder/800/1000", caption: "Lightweight outerwear" },
      { url: "/api/placeholder/800/1000", caption: "Complete travel wardrobe" }
    ]
  }
];

export default function Lookbook() {
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
            <h1 className="text-5xl font-display font-medium text-paper mb-4">Lookbook</h1>
            <p className="text-xl text-graphite leading-relaxed">
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
                className="group cursor-pointer"
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
        <section className="bg-paper py-16">
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
                <Button variant="outline" className="border-ink text-ink hover:bg-ink hover:text-paper">
                  Explore Our Process
                </Button>
              </div>
              <div className="aspect-[4/3] overflow-hidden bg-mink">
                <img
                  src="/api/placeholder/600/450"
                  alt="Atelier workspace"
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