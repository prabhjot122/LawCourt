import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  Scale,
  BookOpen,
  Users,
  Briefcase,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Shield,
  Award,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ModernHero = () => {
  const { isAuthenticated, user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: 'Legal Publications',
      description: 'Access comprehensive legal research, blog posts, and scholarly papers',
      gradient: 'from-gray-800 to-black'
    },
    {
      icon: Briefcase,
      title: 'Career Opportunities',
      description: 'Discover internships, jobs, and clerkships in the legal field',
      gradient: 'from-gray-700 to-gray-900'
    },
    {
      icon: Users,
      title: 'Professional Network',
      description: 'Connect with legal professionals, mentors, and peers',
      gradient: 'from-black to-gray-800'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Legal Professionals', icon: Users },
    { number: '5K+', label: 'Research Papers', icon: BookOpen },
    { number: '500+', label: 'Career Opportunities', icon: Briefcase },
    { number: '95%', label: 'Success Rate', icon: TrendingUp }
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Sophisticated Legal Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle legal pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        {/* Elegant floating elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/[0.03] rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/[0.02] rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-white/[0.025] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />

        {/* Multiple scales of justice for depth */}
        <div
          className="absolute top-1/4 right-1/3 opacity-[0.03] transform transition-transform duration-1000"
          style={{ transform: `translateY(${scrollY * 0.2}px) rotate(${scrollY * 0.05}deg)` }}
        >
          <Scale className="w-80 h-80 text-white" />
        </div>
        <div
          className="absolute bottom-1/4 left-1/4 opacity-[0.02] transform transition-transform duration-1000"
          style={{ transform: `translateY(${scrollY * -0.15}px) rotate(${scrollY * -0.03}deg)` }}
        >
          <BookOpen className="w-64 h-64 text-white" />
        </div>
        <div
          className="absolute top-1/2 right-10 opacity-[0.015] transform transition-transform duration-1000"
          style={{ transform: `translateY(${scrollY * 0.25}px)` }}
        >
          <Shield className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Professional Header Badge */}
          <div
            className={cn(
              "flex justify-center mb-12 transition-all duration-1200 ease-out",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
            )}
          >
            <Badge className="bg-white/[0.08] text-white border-white/[0.15] px-8 py-3 text-sm font-medium backdrop-blur-md hover:bg-white/[0.12] transition-all duration-500 shadow-2xl">
              <Award className="w-4 h-4 mr-3" />
              Trusted by Legal Professionals Worldwide
            </Badge>
          </div>

          {/* Sophisticated Main Headline */}
          <div className="text-center mb-16">
            <h1
              className={cn(
                "text-6xl md:text-8xl lg:text-9xl font-black text-white mb-8 tracking-tighter transition-all duration-1200 ease-out",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12",
                "font-serif leading-[0.85]"
              )}
              style={{
                animationDelay: '0.3s',
                textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.1)'
              }}
            >
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                Law
              </span>
              <span className="text-white block md:inline">Fort</span>
            </h1>

            <div
              className={cn(
                "w-32 h-1 bg-gradient-to-r from-white/60 to-white/20 mx-auto mb-8 transition-all duration-1200 ease-out",
                isLoaded ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
              )}
              style={{ animationDelay: '0.5s' }}
            />

            <p
              className={cn(
                "text-xl md:text-2xl lg:text-3xl text-gray-200 max-w-4xl mx-auto mb-12 leading-relaxed font-light transition-all duration-1200 ease-out",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              )}
              style={{
                animationDelay: '0.6s',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}
            >
              The premier platform empowering legal professionals with sophisticated resources,
              exclusive career opportunities, and an elite community of industry leaders.
            </p>

            {/* Premium CTA Buttons */}
            <div
              className={cn(
                "flex flex-col sm:flex-row gap-6 justify-center items-center mb-20 transition-all duration-1200 ease-out",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              )}
              style={{ animationDelay: '0.8s' }}
            >
              {!isAuthenticated ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-black hover:bg-gray-50 px-12 py-5 text-lg font-bold rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.4)] transition-all duration-500 group border-2 border-white/20 hover:border-white/40"
                  >
                    <Link to="/signup">
                      Begin Your Journey
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </Link>
                  </Button>
                  
                </>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-black hover:bg-gray-50 px-12 py-5 text-lg font-bold rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.4)] transition-all duration-500 group border-2 border-white/20 hover:border-white/40"
                >
                  <Link to={user?.role === 'User' ? '/dashboard' : '/editor-dashboard'}>
                    Go to Dashboard
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Premium Feature Cards */}
          <div
            className={cn(
              "grid grid-cols-1 md:grid-cols-3 gap-10 mb-20 transition-all duration-1200 ease-out",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
            )}
            style={{ animationDelay: '1s' }}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/[0.04] backdrop-blur-md rounded-3xl p-10 border border-white/[0.08] hover:border-white/[0.15] transition-all duration-700 hover:bg-white/[0.06] hover:-translate-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
                style={{ animationDelay: `${1 + index * 0.15}s` }}
              >
                <div className={`inline-flex p-5 rounded-3xl bg-gradient-to-br ${feature.gradient} mb-8 group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed text-lg font-light">{feature.description}</p>

                {/* Subtle accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>

          {/* Premium Stats Section */}
          <div
            className={cn(
              "grid grid-cols-2 md:grid-cols-4 gap-12 transition-all duration-1200 ease-out",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
            )}
            style={{ animationDelay: '1.2s' }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex p-4 rounded-full bg-white/[0.08] border border-white/[0.1] mb-6 group-hover:bg-white/[0.12] group-hover:border-white/[0.2] transition-all duration-500 shadow-lg backdrop-blur-sm">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                  {stat.number}
                </div>
                <div className="text-gray-300 text-base font-medium tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-white/60" />
      </div>
    </section>
  );
};

export default ModernHero;
