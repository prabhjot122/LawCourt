import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  BookOpen,
  Briefcase,
  Shield,
  Zap,
  Award,
  Globe,
  Sparkles,
  Target,
  TrendingUp,
  Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CallToAction = () => {
  const { isAuthenticated, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const benefits = [
    {
      icon: BookOpen,
      title: 'Access Premium Content',
      description: 'Unlimited access to legal research, articles, and expert insights'
    },
    {
      icon: Briefcase,
      title: 'Career Opportunities',
      description: 'Exclusive job listings and internship opportunities'
    },
    {
      icon: Users,
      title: 'Professional Network',
      description: 'Connect with 10,000+ legal professionals worldwide'
    },
    {
      icon: Award,
      title: 'Skill Development',
      description: 'Enhance your legal expertise with curated resources'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Senior Associate',
      company: 'Wilson & Partners',
      quote: 'LawFort transformed my career. The resources and networking opportunities are unmatched.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Legal Researcher',
      company: 'Harvard Law School',
      quote: 'The research papers and academic content on LawFort are exceptional quality.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Corporate Counsel',
      company: 'Tech Innovations Inc.',
      quote: 'Found my dream job through LawFort. The platform is a game-changer for legal professionals.',
      rating: 5
    }
  ];

  const features = [
    'Unlimited access to all content',
    'Priority job application status',
    'Advanced search capabilities',
    'Professional networking tools',
    'Career development resources',
    'Expert mentorship opportunities'
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
      {/* Sophisticated background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      

      <div className="container mx-auto px-4 relative z-10">
        {/* Premium Main CTA Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-black mb-4 tracking-tight">
              Why Choose LawFort?
            </h3>
            <p className="text-gray-600 text-lg legal-text">
              Discover the benefits that set us apart
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-gray-800 to-black mb-4 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-black mb-2 tracking-tight">
                    {benefit.title}
                  </h4>
                  <p className="text-gray-600 text-sm legal-text">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div
          className={cn(
            "relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gray-950 via-black to-gray-900 p-12 md:p-20 mb-20 transition-all duration-1200 shadow-[0_20px_60px_rgba(0,0,0,0.3)]",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Sophisticated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Legal pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />

            {/* Elegant floating elements */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/[0.015] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.01] rounded-full blur-3xl" />

            {/* Legal symbols */}
            <div className="absolute top-1/4 right-1/4 opacity-[0.02]">
              <Scale className="w-64 h-64 text-white" />
            </div>
            <div className="absolute bottom-1/4 left-1/4 opacity-[0.015]">
              <Shield className="w-48 h-48 text-white" />
            </div>
          </div>
          

          <div className="relative z-10 text-center text-white">
            <div className="inline-flex items-center gap-3 bg-white/[0.08] backdrop-blur-md px-8 py-3 rounded-2xl text-sm font-bold mb-12 shadow-lg border border-white/[0.1]">
              <Award className="w-5 h-5" />
              Join the Elite Legal Community
            </div>

            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter leading-[0.9]" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              Ready to Advance Your
              <span className="block bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent mt-2">
                Legal Career?
              </span>
            </h2>

            <div className="w-32 h-1 bg-gradient-to-r from-white/60 to-white/20 mx-auto mb-10" />

            <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto mb-16 font-light leading-relaxed" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              Join thousands of distinguished legal professionals who trust LawFort for career advancement,
              knowledge sharing, and professional development. Begin your journey to excellence today.
            </p>

            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-16">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-black hover:bg-gray-50 px-12 py-5 text-xl font-bold rounded-2xl shadow-[0_8px_30px_rgba(255,255,255,0.3)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.4)] transition-all duration-500 group border-2 border-white/20 hover:border-white/40"
                >
                  <Link to="/signup">
                    Begin Your Journey
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </Link>
                </Button>
                
              </div>
            ) : (
              <div className="flex justify-center mb-16">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-black hover:bg-gray-50 px-12 py-5 text-xl font-bold rounded-2xl shadow-[0_8px_30px_rgba(255,255,255,0.3)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.4)] transition-all duration-500 group border-2 border-white/20 hover:border-white/40"
                >
                  <Link to={user?.role === 'User' ? '/dashboard' : '/editor-dashboard'}>
                    Access Dashboard
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-left">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Section */}


        {/* Testimonials */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-black mb-4 tracking-tight">
              Trusted by Legal Professionals
            </h3>
            <p className="text-gray-600 text-lg legal-text">
              See what our community has to say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-gray-200 bg-white hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4 legal-text italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-black tracking-tight">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Final CTA */}
        {!isAuthenticated && (
          <div className="text-center mt-20">
            <h3 className="text-3xl font-bold text-black mb-6 tracking-tight">
              Ready to Elevate Your Legal Career?
            </h3>
            <p className="text-xl text-gray-700 mb-10 font-light max-w-2xl mx-auto leading-relaxed">
              Join thousands of legal professionals who trust LawFort for career advancement and professional growth
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-gray-900 to-black text-white hover:from-black hover:to-gray-800 px-8 py-4 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <Link to="/signup">
                  Create Free Account
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300">
                <Link to="/blogs">
                  Explore Content First
                  <BookOpen className="ml-3 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CallToAction;
