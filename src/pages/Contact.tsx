import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      details: ["Kathmandu, Nepal", "Thamel District"],
      description: "Our showroom is located in the heart of Kathmandu's creative district."
    },
    {
      icon: Phone,
      title: "Call Us",
      details: ["+977 1 234 5678", "+977 98 7654 3210"],
      description: "Monday to Saturday, 10 AM - 6 PM NPT"
    },
    {
      icon: Mail,
      title: "Email Us",
      details: ["hello@vin-c.com", "support@vin-c.com"],
      description: "We typically respond within 24 hours."
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: ["Mon - Sat: 10 AM - 6 PM", "Sunday: Closed"],
      description: "Extended hours during sale seasons."
    }
  ];

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />

      <main className="pt-24">
        {/* Header */}
        <div className="container mx-auto px-4 mb-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-display font-medium text-paper mb-6">Contact Us</h1>
            <p className="text-xl text-graphite leading-relaxed">
              We'd love to hear from you. Whether you have questions about our collections,
              need styling advice, or want to discuss custom orders, our team is here to help.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <Card className="border-mink/20">
                <CardHeader>
                  <CardTitle className="text-2xl font-display text-paper">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-paper">Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="border-mink/30 focus:border-accent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-paper">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="border-mink/30 focus:border-accent"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-paper">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="border-mink/30 focus:border-accent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-paper">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        className="border-mink/30 focus:border-accent resize-none"
                        placeholder="Tell us how we can help you..."
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/90 text-paper"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-display font-medium text-paper mb-6">
                  Get in Touch
                </h2>
                <p className="text-graphite leading-relaxed mb-8">
                  Whether you're interested in our ready-to-wear collections, custom tailoring,
                  or simply want to learn more about our craftsmanship, we're here to assist you.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <Card key={index} className="border-mink/20">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-6 h-6 text-accent" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-display font-medium text-paper mb-2">
                              {info.title}
                            </h3>
                            {info.details.map((detail, idx) => (
                              <p key={idx} className="text-graphite font-medium">
                                {detail}
                              </p>
                            ))}
                            <p className="text-graphite/80 text-sm mt-2">
                              {info.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <section className="bg-paper py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-medium text-ink mb-4">
                Visit Our Showroom
              </h2>
              <p className="text-ink/80 max-w-2xl mx-auto">
                Experience our collections in person at our Kathmandu showroom.
                Our team will be happy to provide personalized styling advice and guide you through our current offerings.
              </p>
            </div>

            <div className="aspect-[16/9] max-w-4xl mx-auto bg-mink/10 rounded-lg overflow-hidden">
              {/* Placeholder for map - you can integrate Google Maps or similar here */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-accent mx-auto mb-4" />
                  <p className="text-graphite text-lg">Interactive Map Coming Soon</p>
                  <p className="text-graphite/80">Kathmandu, Nepal</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-display font-medium text-paper text-center mb-12">
                Frequently Asked Questions
              </h2>

              <div className="space-y-8">
                <div className="border-b border-mink/20 pb-6">
                  <h3 className="text-xl font-display font-medium text-paper mb-3">
                    Do you offer international shipping?
                  </h3>
                  <p className="text-graphite leading-relaxed">
                    Yes, we ship worldwide. Shipping costs and delivery times vary by location.
                    All orders include tracking information and insurance.
                  </p>
                </div>

                <div className="border-b border-mink/20 pb-6">
                  <h3 className="text-xl font-display font-medium text-paper mb-3">
                    What is your return policy?
                  </h3>
                  <p className="text-graphite leading-relaxed">
                    We offer a 30-day return policy for unworn items in original condition.
                    Custom orders are subject to different terms and require advance discussion.
                  </p>
                </div>

                <div className="border-b border-mink/20 pb-6">
                  <h3 className="text-xl font-display font-medium text-paper mb-3">
                    Do you offer custom tailoring?
                  </h3>
                  <p className="text-graphite leading-relaxed">
                    Absolutely. Our bespoke service allows for complete customization of fit,
                    fabric, and details. Contact us to discuss your vision and schedule a consultation.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-display font-medium text-paper mb-3">
                    How can I care for my VIN.C garments?
                  </h3>
                  <p className="text-graphite leading-relaxed">
                    Each garment includes specific care instructions. Generally, we recommend
                    professional cleaning for our premium fabrics. Store items on wooden hangers
                    and avoid direct sunlight to maintain color and shape.
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