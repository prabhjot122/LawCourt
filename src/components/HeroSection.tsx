
import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { GavelIcon, BookOpenIcon, ScaleIcon, ScrollTextIcon, GraduationCapIcon } from 'lucide-react';

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

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
    {
      number: "50K+",
      label: "Legal Documents",
      icon: <ScrollTextIcon className="h-6 w-6 mb-2 text-golden-600" />
    },
    {
      number: "10K+",
      label: "Active Members",
      icon: <GraduationCapIcon className="h-6 w-6 mb-2 text-golden-600" />
    },
    {
      number: "Daily",
      label: "Case Updates",
      icon: <BookOpenIcon className="h-6 w-6 mb-2 text-golden-600" />
    }
  ];

  return (
    <section
      ref={heroRef}
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #1A1F2C 0%, #2C3E50 100%)"
      }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Courthouse pillars - left */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-16 md:w-24 bg-courtroom-dark opacity-20",
            "transform -skew-x-6",
            isLoaded ? "opacity-20 translate-x-0" : "opacity-0 -translate-x-full",
            "transition-all duration-1000 ease-out"
          )}
          style={{
            boxShadow: "inset -10px 0 10px rgba(0,0,0,0.2)"
          }}
        />

        {/* Courthouse pillars - right */}
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-16 md:w-24 bg-courtroom-dark opacity-20",
            "transform skew-x-6",
            isLoaded ? "opacity-20 translate-x-0" : "opacity-0 translate-x-full",
            "transition-all duration-1000 ease-out"
          )}
          style={{
            boxShadow: "inset 10px 0 10px rgba(0,0,0,0.2)"
          }}
        />

        {/* Scales of justice - subtle background */}
        <div
          className={cn(
            "absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
            "w-[600px] h-[600px] opacity-5",
            isLoaded ? "opacity-5 scale-100" : "opacity-0 scale-90",
            "transition-all duration-1500 ease-out"
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
            <path d="M12 3V21M12 3L7 8M12 3L17 8M7 8H17M7 8C7 10.7614 9.23858 13 12 13C14.7614 13 17 10.7614 17 8M7 21H17"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Parallax effect on scroll */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
        {/* Logo/Icon */}
        <div
          className="mb-24"
        >
         
        </div>

        {/* Headline */}
        <div
          className={cn(
            "text-center mb-6 transition-all duration-700 ease-out",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8",
            "delay-100"
          )}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            <span className="text-golden-300">Law</span>
            <span className="text-white">Court</span>
          </h1>
          <div className="h-1 w-24 bg-golden-500 mx-auto rounded-full"></div>
        </div>

        {/* Tagline */}
        <p
          className={cn(
            "text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-12 text-center transition-all duration-700 ease-out",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8",
            "delay-200"
          )}
        >
          Empowering legal professionals with knowledge, community, and opportunities for excellence.
        </p>

        {/* Feature Cards */}
        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-12 transition-all duration-700 ease-out",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12",
            "delay-300"
          )}
        >
          {/* Card 1 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-golden-500/50 transition-all duration-300 group hover:bg-white/10">
            <div className="bg-golden-500/10 rounded-full w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-golden-500/20 transition-all duration-300">
              <GavelIcon className="h-6 w-6 text-golden-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Legal Resources</h3>
            <p className="text-white/70">Access comprehensive legal documents, precedents, and research materials.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-golden-500/50 transition-all duration-300 group hover:bg-white/10">
            <div className="bg-golden-500/10 rounded-full w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-golden-500/20 transition-all duration-300">
              <BookOpenIcon className="h-6 w-6 text-golden-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Professional Network</h3>
            <p className="text-white/70">Connect with peers, mentors, and experts in various legal specializations.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-golden-500/50 transition-all duration-300 group hover:bg-white/10">
            <div className="bg-golden-500/10 rounded-full w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-golden-500/20 transition-all duration-300">
              <ScaleIcon className="h-6 w-6 text-golden-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Career Growth</h3>
            <p className="text-white/70">Discover opportunities, continuing education, and professional development.</p>
          </div>
        </div>

        {/* Stats */}
        <div
          className={cn(
            "flex flex-wrap justify-center gap-8 md:gap-16 mb-12 transition-all duration-700 ease-out",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "delay-500"
          )}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex flex-col items-center">
                {stat.icon}
                <div
                  className={cn(
                    "text-3xl md:text-4xl font-bold text-golden-300",
                    "transition-all duration-500",
                  )}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {stat.number}
                </div>
                <div className="text-white/70">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div
          className={cn(
            "flex flex-col sm:flex-row gap-4 transition-all duration-700 ease-out",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            "delay-700"
          )}
        >
          
        </div>


      </div>
    </section>
  );
};

export default HeroSection;
