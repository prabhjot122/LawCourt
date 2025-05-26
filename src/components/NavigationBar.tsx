
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Book, Calendar, Briefcase } from "lucide-react";

const NavigationBar = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [activeSection, setActiveSection] = useState("home");
  
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;
      const maxScroll = documentHeight - windowHeight;
      const scrollPercentage = position / maxScroll;
      
      setScrollPosition(scrollPercentage);
      
      if (scrollPercentage < 0.25) {
        setActiveSection("home");
      } else if (scrollPercentage < 0.5) {
        setActiveSection("resources");
      } else if (scrollPercentage < 0.75) {
        setActiveSection("community");
      } else if (scrollPercentage < 0.9) {
        setActiveSection("career");
      } else {
        setActiveSection("events");
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div className="fixed left-8 top-0 h-full flex flex-col items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-sm rounded-full p-2 shadow-lg">
        <div className="h-[400px] w-1 bg-gray-200 rounded-full">
          <div 
            className="w-full bg-golden-500 rounded-full transition-all duration-300 ease-out"
            style={{ height: `${scrollPosition * 100}%` }}
          />
        </div>
        
        
      </div>
    </div>
  );
};

export default NavigationBar;
