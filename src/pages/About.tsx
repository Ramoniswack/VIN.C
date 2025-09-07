import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const values = [
  {
    title: "Craftsmanship",
    description: "Every garment is constructed with traditional techniques passed down through generations of Italian artisans.",
    icon: "craft"
  },
  {
    title: "Sustainability",
    description: "We source only the finest natural fibers and maintain ethical partnerships throughout our supply chain.",
    icon: "leaf"
  },
  {
    title: "Timelessness",
    description: "Our designs transcend seasonal trends, focusing on enduring style and impeccable construction.",
    icon: "clock"
  },
  {
    title: "Precision",
    description: "Each piece undergoes rigorous quality control to ensure it meets our exacting standards.",
    icon: "📐"
  }
];

const timeline = [
  {
    year: "2018",
    title: "Foundation",
    description: "VIN.C was founded with a vision to create contemporary luxury garments that honor traditional craftsmanship."
  },
  {
    year: "2019",
    title: "Atelier Partnership",
    description: "Established partnerships with family-owned ateliers in Northern Italy, known for their expertise in tailoring."
  },
  {
    year: "2021",
    title: "Sustainable Initiative",
    description: "Launched our sustainability program, ensuring all materials are sourced responsibly and ethically."
  },
  {
    year: "2023",
    title: "Global Recognition",
    description: "Received international acclaim for our approach to modern luxury and sustainable fashion practices."
  },
  {
    year: "2024",
    title: "Future Vision",
    description: "Continuing to innovate while staying true to our core values of quality, sustainability, and timeless design."
  }
];

const getIconSvg = (iconType: string) => {
  switch (iconType) {
    case 'craft':
      return (
        <svg className="w-10 h-10 text-accent mx-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.5 22l1.5-7h4l1.5 7H8.5zM12 3C9.79 3 8 4.79 8 7c0 1.19.53 2.25 1.36 2.97L8.09 16h7.82l-1.27-6.03C15.47 9.25 16 8.19 16 7c0-2.21-1.79-4-4-4z"/>
        </svg>
      );
    case 'leaf':
      return (
        <svg className="w-10 h-10 text-accent mx-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    case 'clock':
      return (
        <svg className="w-10 h-10 text-accent mx-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      );
    default:
      return null;
  }
};

export default function About() {
  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl font-display font-medium text-paper leading-tight">
                Where tradition meets innovation
              </h1>
              <p className="text-xl text-graphite leading-relaxed">
                VIN.C represents the confluence of time-honored craftsmanship and contemporary design philosophy. 
                We create garments that speak to the modern individual who values quality, sustainability, and enduring style.
              </p>
              <Button className="mt-8">
                Discover Our Process
              </Button>
            </div>
            <div className="aspect-[4/3] overflow-hidden bg-mink/10">
              <img
                src="/api/placeholder/600/450"
                alt="VIN.C atelier workspace"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-paper py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-medium text-ink mb-4">
                Our Values
              </h2>
              <p className="text-xl text-ink/80 max-w-2xl mx-auto">
                These principles guide every decision we make, from material selection to final finishing.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center space-y-4">
                  <div className="mb-4">{getIconSvg(value.icon)}</div>
                  <h3 className="text-xl font-medium text-ink">{value.title}</h3>
                  <p className="text-ink/70 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Craftsmanship Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="aspect-[4/3] overflow-hidden bg-mink/10">
              <img
                src="/api/placeholder/600/450"
                alt="Artisan at work"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-display font-medium text-paper">
                Artisanal Excellence
              </h2>
              <p className="text-lg text-graphite leading-relaxed">
                Our partnership with master tailors in Northern Italy ensures that each garment receives 
                the attention to detail that only comes from decades of experience. From pattern making 
                to final pressing, every step is executed with precision and care.
              </p>
              <p className="text-lg text-graphite leading-relaxed">
                We believe in the slow fashion movement—creating fewer, better pieces that will last 
                for generations rather than seasons. This philosophy is reflected in our choice of 
                materials, construction methods, and timeless designs.
              </p>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="bg-mink/5 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-medium text-paper mb-4">
                Our Journey
              </h2>
              <p className="text-xl text-graphite max-w-2xl mx-auto">
                From a small atelier to an internationally recognized brand, 
                discover the milestones that have shaped VIN.C.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="space-y-12">
                {timeline.map((item, index) => (
                  <div
                    key={index}
                    className={`flex flex-col md:flex-row gap-8 items-start ${
                      index % 2 === 1 ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    <div className="md:w-1/3 text-center md:text-left">
                      <div className="inline-block px-4 py-2 bg-accent text-bg font-medium rounded-md">
                        {item.year}
                      </div>
                    </div>
                    <div className="md:w-2/3 space-y-3">
                      <h3 className="text-2xl font-display font-medium text-paper">
                        {item.title}
                      </h3>
                      <p className="text-graphite leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sustainability Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-medium text-paper mb-6">
              Sustainable Luxury
            </h2>
            <p className="text-xl text-graphite max-w-3xl mx-auto leading-relaxed">
              We believe luxury and sustainability are not mutually exclusive. Our commitment to 
              environmental responsibility is woven into every aspect of our business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">🌿</span>
              </div>
              <h3 className="text-xl font-medium text-paper">Natural Fibers</h3>
              <p className="text-graphite">
                We exclusively use natural, renewable fibers sourced from certified sustainable farms.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2v3.56c0 .32-.26.58-.58.58s-.58-.26-.58-.58V2c0-.55-.45-1-1-1s-1 .45-1 1v3.56c0 .32-.26.58-.58.58s-.58-.26-.58-.58V2c0-.55-.45-1-1-1s-1 .45-1 1v3.56c0 .32-.26.58-.58.58s-.58-.26-.58-.58V2c0-.55-.45-1-1-1s-1 .45-1 1v1.89l-.89-1.78C2.45 1.49 2 1.89 2 2.5v19c0 .28.22.5.5.5h19c.28 0 .5-.22.5-.5v-19c0-.61-.45-1.01-1.11-.39L20 3.89V2c0-.55-.45-1-1-1s-1 .45-1 1v3.56c0 .32-.26.58-.58.58s-.58-.26-.58-.58V2c0-.55-.45-1-1-1s-1 .45-1 1v3.56c0 .32-.26.58-.58.58s-.58-.26-.58-.58V2c0-.55-.45-1-1-1s-1 .45-1 1z"/>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-paper">Circular Design</h3>
              <p className="text-graphite">
                Our garments are designed for longevity and can be repaired, altered, or recycled.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-paper">Ethical Partnerships</h3>
              <p className="text-graphite">
                We maintain fair trade relationships with all our suppliers and craftspeople.
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-paper py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-display font-medium text-ink mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-ink/80 mb-8 max-w-2xl mx-auto">
              Have questions about our process, sustainability practices, or custom tailoring services? 
              We'd love to hear from you.
            </p>
            <Button variant="outline" className="border-ink text-ink hover:bg-ink hover:text-paper">
              Contact Us
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}