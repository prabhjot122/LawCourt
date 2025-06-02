
import React, { useEffect } from 'react';
import AuthHeader from '@/components/AuthHeader';
import ModernHero from '@/components/homepage/ModernHero';
import FeaturedContent from '@/components/homepage/FeaturedContent';
import ServiceShowcase from '@/components/homepage/ServiceShowcase';
import StatsSection from '@/components/homepage/StatsSection';
import CallToAction from '@/components/homepage/CallToAction';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { useSmoothScroll } from '@/hooks/useScrollAnimation';

const Index = () => {
  // Enable smooth scrolling
  useSmoothScroll();

  // Update page title and meta description
  useEffect(() => {
    document.title = "LawFort | Professional Legal Platform for Modern Lawyers";

    // Add meta description for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'LawFort - The premier platform for legal professionals. Access exclusive resources, career opportunities, and connect with a distinguished community of lawyers and legal experts.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'LawFort - The premier platform for legal professionals. Access exclusive resources, career opportunities, and connect with a distinguished community of lawyers and legal experts.';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="homepage-container min-h-screen bg-white relative">
      <AuthHeader />
      <main>
        <ModernHero />
        <FeaturedContent />
        <ServiceShowcase />
        <StatsSection />
        <CallToAction />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
