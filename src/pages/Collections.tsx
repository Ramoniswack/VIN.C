import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const collections = [
  {
    id: "essentials",
    title: "Essentials",
    description: "Timeless pieces that form the foundation of any wardrobe",
    image: "/Products/WhiteJack.jpg",
    items: ["Tailored Shirts", "Chinos", "Blazers", "Knitwear"],
    featured: true
  },
  {
    id: "outerwear",
    title: "Outerwear",
    description: "Protective layers crafted with premium materials",
    image: "/Products/CamoJack.jpg",
    items: ["Field Jackets", "Overcoats", "Bomber Jackets", "Trench Coats"],
    featured: false
  },
  {
    id: "bottoms",
    title: "Bottoms",
    description: "Versatile trousers and shorts for every occasion",
    image: "/Products/RegalChinos.jpg",
    items: ["Tailored Trousers", "Chinos", "Cargo Pants", "Shorts"],
    featured: false
  },
  {
    id: "accessories",
    title: "Accessories",
    description: "Refined details that complete the look",
    image: "/Products/MoccaCombo.png",
    items: ["Leather Belts", "Watches", "Ties", "Pocket Squares"],
    featured: false
  }
];

const seasonalCollections = [
  {
    id: "autumn-winter",
    title: "Autumn/Winter 2024",
    description: "Warm layers and sophisticated silhouettes for the cooler months",
    image: "/Products/ZenkageJack.jpg",
    season: "Fall/Winter",
    status: "Current"
  },
  {
    id: "spring-summer",
    title: "Spring/Summer 2024",
    description: "Lightweight fabrics and relaxed fits for warmer weather",
    image: "/Products/Noragi.jpg",
    season: "Spring/Summer",
    status: "Available"
  }
];

export default function Collections() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />

      <main className="pt-24">
        {/* Header */}
        <div className="container mx-auto px-4 mb-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-display font-medium text-paper mb-6">Collections</h1>
            <p className="text-xl text-graphite leading-relaxed mb-8">
              Discover our carefully curated collections, each designed to offer versatility,
              quality, and timeless style. From essential wardrobe staples to seasonal
              statements, every piece is crafted with attention to detail.
            </p>
            <Button
              onClick={() => navigate('/shop')}
              className="bg-accent hover:bg-accent/90 text-paper"
            >
              Shop All Collections
            </Button>
          </div>
        </div>

        {/* Featured Collections */}
        <section className="mb-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-medium text-paper mb-12">Featured Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {collections.filter(collection => collection.featured).map((collection) => (
                <Card key={collection.id} className="overflow-hidden border-mink/20 hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-display font-medium text-paper mb-3">
                      {collection.title}
                    </h3>
                    <p className="text-graphite mb-4 leading-relaxed">
                      {collection.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {collection.items.map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="border-accent text-accent hover:bg-accent hover:text-paper"
                      onClick={() => navigate(`/shop?collection=${collection.id}`)}
                    >
                      Explore {collection.title}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* All Collections Grid */}
        <section className="mb-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-medium text-paper mb-12">Browse All Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections.map((collection) => (
                <Card key={collection.id} className="overflow-hidden border-mink/20 hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-display font-medium text-paper mb-2">
                      {collection.title}
                    </h3>
                    <p className="text-graphite mb-3 text-sm leading-relaxed">
                      {collection.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {collection.items.slice(0, 2).map((item) => (
                        <Badge key={item} variant="outline" className="text-xs border-mink/30">
                          {item}
                        </Badge>
                      ))}
                      {collection.items.length > 2 && (
                        <Badge variant="outline" className="text-xs border-mink/30">
                          +{collection.items.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seasonal Collections */}
        <section className="bg-paper py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-medium text-ink mb-6">Seasonal Collections</h2>
              <p className="text-lg text-ink/80 max-w-2xl mx-auto">
                Each season brings new inspiration and refined pieces designed for the current moment
                while maintaining our commitment to timeless quality.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {seasonalCollections.map((collection) => (
                <div key={collection.id} className="group">
                  <div className="aspect-[4/3] overflow-hidden mb-6">
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                        {collection.season}
                      </Badge>
                      <Badge variant="outline" className="border-accent text-accent">
                        {collection.status}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-display font-medium text-ink">
                      {collection.title}
                    </h3>
                    <p className="text-ink/80 leading-relaxed">
                      {collection.description}
                    </p>
                    <Button
                      variant="outline"
                      className="border-ink text-ink hover:bg-ink hover:text-paper"
                      onClick={() => navigate(`/shop?season=${collection.id}`)}
                    >
                      View Collection
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Collection Philosophy */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-display font-medium text-paper mb-8">
                Our Collection Philosophy
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-accent font-bold">01</span>
                  </div>
                  <h3 className="text-xl font-display font-medium text-paper">Timeless Design</h3>
                  <p className="text-graphite leading-relaxed">
                    Pieces designed to transcend seasons and trends, becoming wardrobe staples
                    that last for years.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-accent font-bold">02</span>
                  </div>
                  <h3 className="text-xl font-display font-medium text-paper">Quality Materials</h3>
                  <p className="text-graphite leading-relaxed">
                    Sourcing the finest fabrics and materials, ensuring each garment maintains
                    its integrity over time.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-accent font-bold">03</span>
                  </div>
                  <h3 className="text-xl font-display font-medium text-paper">Artisanal Craftsmanship</h3>
                  <p className="text-graphite leading-relaxed">
                    Every stitch and detail is executed with precision by skilled artisans,
                    honoring traditional techniques.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
