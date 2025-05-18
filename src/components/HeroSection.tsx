
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import ScaleAnimation from './ScaleAnimation';

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Set loaded after a short delay for entrance animation
    const loadTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(loadTimer);
    };
  }, []);

  const stats = [
    { number: "50K+", label: "Legal Documents" },
    { number: "10K+", label: "Active Members" },
    { number: "Daily", label: "Case Updates" }
  ];
  
  return (
    <section 
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center py-20"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f9f7f2 100%)"
      }}
    >
      {/* Parallax Background */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          transform: `translateY(${scrollY * 0.3}px)`,
          transition: "transform 0.1s ease-out"
        }}
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488590528505-98d2b5aba04b')] bg-cover bg-center opacity-5" />
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-center">
        <div 
          className={cn(
            "mb-6 inline-block transition-all duration-700 ease-out",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          )}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-courtroom-dark mb-2">Legal Portal</h1>
          <div className="h-1 w-24 bg-golden-500 mx-auto rounded-full" />
        </div>
        
        <p 
          className={cn(
            "text-xl md:text-2xl text-courtroom-neutral max-w-2xl mx-auto mb-12 transition-all duration-700 ease-out",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8",
            "delay-200"
          )}
        >
          Your comprehensive resource for legal education, community, career opportunities, and professional events.
        </p>
        
        {/* Balanced Scales Animation */}
        <div 
          className={cn(
            "transition-all duration-700 ease-out",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}
        >
          <ScaleAnimation />
        </div>
        
        {/* Stats */}
        <div 
          className={cn(
            "flex flex-wrap justify-center gap-8 mt-8 transition-all duration-700 ease-out",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "delay-500"
          )}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div 
                className={cn(
                  "text-3xl md:text-4xl font-bold text-golden-500",
                  "transition-all duration-500",
                  "delay-700"
                )}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {stat.number}
              </div>
              <div className="text-courtroom-neutral">{stat.label}</div>
            </div>
          ))}
        </div>
        
        {/* Call to Action */}
        <div 
          className={cn(
            "mt-12 transition-all duration-700 ease-out",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "delay-700"
          )}
        >
          <button className="bg-golden-500 hover:bg-golden-600 text-white px-8 py-3 rounded-full font-semibold transition-all hover:shadow-lg transform hover:scale-105">
            Explore Resources
          </button>
          <button className="ml-4 border border-golden-500 hover:bg-golden-50 text-golden-700 px-8 py-3 rounded-full font-semibold transition-all">
            Join Community
          </button>
        </div>
        
        {/* Scroll indicator */}
        <div 
          className={cn(
            "absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center",
            "animate-bounce transition-all duration-700 ease-out",
            isLoaded ? "opacity-100" : "opacity-0",
            "delay-1000"
          )}
        >
          <span className="text-sm text-courtroom-neutral mb-2">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-golden-300 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-golden-500 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
