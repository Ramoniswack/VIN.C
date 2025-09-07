import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import heroImage from '@/assets/hero-image.jpg';

export const Hero = () => {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set([titleRef.current, subtitleRef.current, buttonRef.current], {
        opacity: 0,
        y: 40
      });

      // Create timeline
      const tl = gsap.timeline({ delay: 0.5 });
      
      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      })
      .to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out"
      }, "-=0.4")
      .to(buttonRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out"
      }, "-=0.3")
      .to(underlineRef.current, {
        scaleX: 1,
        duration: 0.8,
        ease: "power3.out",
        transformOrigin: "left"
      }, "-=0.6");

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage}
          alt="VIN.C Premium Fashion"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <h1 
          ref={titleRef}
          className={`font-display font-medium text-5xl md:text-7xl lg:text-8xl mb-6 tracking-tighter leading-none transition-colors duration-300 ${
            theme === 'dark' ? 'text-paper' : 'text-white'
          }`}
        >
          Tailored{' '}
          <span className="relative inline-block">
            Quiet Luxury
            <span 
              ref={underlineRef}
              className="absolute bottom-2 left-0 w-full h-px bg-accent-color origin-left scale-x-0"
            />
          </span>
        </h1>
        
        <p 
          ref={subtitleRef}
          className={`font-body text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed transition-colors duration-300 ${
            theme === 'dark' ? 'text-mink' : 'text-gray-200'
          }`}
        >
          VIN.C crafts limited-run Nepalese garments for the discerning minimalist. 
          Designed with restraint, cut with precision, finished by skilled artisans.
        </p>

        <div ref={buttonRef}>
          <Button 
            size="lg" 
            className={`font-medium px-8 py-6 text-lg tracking-body transition-all duration-300 hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-paper text-ink hover:bg-paper/90' 
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Shop the Drop
          </Button>
        </div>
      </div>
    </section>
  );
};