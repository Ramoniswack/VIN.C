import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const Marquee = () => {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!marqueeRef.current) return;

    const marqueeText = marqueeRef.current.querySelector('.marquee-content');
    if (!marqueeText) return;

    // Clone the content for seamless loop
    const clone = marqueeText.cloneNode(true) as HTMLElement;
    marqueeRef.current.appendChild(clone);

    // GSAP animation
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(marqueeRef.current, {
      x: '-50%',
      duration: 30,
      ease: 'none'
    });

    // Pause on hover
    const handleMouseEnter = () => tl.pause();
    const handleMouseLeave = () => tl.resume();

    marqueeRef.current.addEventListener('mouseenter', handleMouseEnter);
    marqueeRef.current.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      tl.kill();
      if (marqueeRef.current) {
        marqueeRef.current.removeEventListener('mouseenter', handleMouseEnter);
        marqueeRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const marqueeItems = [
    'VIN.C',
    'ATELIER',
    '2025',
    'QUIET LUXURY',
    'MINIMALISM',
    'CRAFTSMANSHIP',
    'LIMITED EDITION',
    'TAILORED'
  ];

  return (
    <div className="border-y border-graphite bg-bg/50 backdrop-blur-sm py-6 overflow-hidden">
      <div 
        ref={marqueeRef} 
        className="flex whitespace-nowrap"
        aria-label="Brand marquee"
      >
        <div className="marquee-content flex items-center">
          {marqueeItems.map((item, index) => (
            <span 
              key={index} 
              className="font-display text-2xl md:text-3xl text-mink tracking-wider mx-16 flex-shrink-0"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};