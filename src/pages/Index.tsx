
import React, { useEffect } from 'react';
import AuthHeader from '@/components/AuthHeader';
import NavigationBar from '@/components/NavigationBar';
import HeroSection from '@/components/HeroSection';
import ResourcesSection from '@/components/ResourcesSection';
import CommunitySection from '@/components/CommunitySection';
import CareerSection from '@/components/CareerSection';
import EventsSection from '@/components/EventsSection';
import Footer from '@/components/Footer';

const Index = () => {
  // Update page title
  useEffect(() => {
    document.title = "Legal Portal | Resources, Community, Career, Events";
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <AuthHeader />
      <NavigationBar />
      <main>
        <HeroSection />
        <ResourcesSection />
        <CommunitySection />
        <CareerSection />
        <EventsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
