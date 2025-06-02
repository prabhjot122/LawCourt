
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-white/80 shadow-md backdrop-blur-sm py-4" : "bg-transparent py-6"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-golden-500 rounded-full flex items-center justify-center mr-2">
              <div className="w-6 h-0.5 bg-white rounded-full" />
            </div>
            <span className={cn(
              "font-bold text-xl transition-colors",
              isScrolled ? "text-courtroom-dark" : "text-courtroom-dark"
            )}>
              Legal Portal
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a 
              href="#resources" 
              className={cn(
                "font-medium transition-colors story-link",
                isScrolled ? "text-courtroom-dark" : "text-courtroom-dark"
              )}
            >
              Resources
            </a>
            <a 
              href="#community" 
              className={cn(
                "font-medium transition-colors story-link",
                isScrolled ? "text-courtroom-dark" : "text-courtroom-dark"
              )}
            >
              Community
            </a>
            <a 
              href="#career" 
              className={cn(
                "font-medium transition-colors story-link",
                isScrolled ? "text-courtroom-dark" : "text-courtroom-dark"
              )}
            >
              Career
            </a>
            <a 
              href="#events" 
              className={cn(
                "font-medium transition-colors story-link",
                isScrolled ? "text-courtroom-dark" : "text-courtroom-dark"
              )}
            >
              Events
            </a>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button className="bg-golden-500 hover:bg-golden-600 text-white px-6 py-2 rounded-full font-medium transition-colors">
              Sign Up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-courtroom-dark focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col space-y-3">
              <a 
                href="#resources" 
                className="px-4 py-2 text-courtroom-dark hover:bg-golden-50 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Resources
              </a>
              <a 
                href="#community" 
                className="px-4 py-2 text-courtroom-dark hover:bg-golden-50 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Community
              </a>
              <a 
                href="#career" 
                className="px-4 py-2 text-courtroom-dark hover:bg-golden-50 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Career
              </a>
              <a 
                href="#events" 
                className="px-4 py-2 text-courtroom-dark hover:bg-golden-50 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Events
              </a>
              <div className="px-4 pt-2">
                <button className="w-full bg-golden-500 hover:bg-golden-600 text-white px-6 py-2 rounded-full font-medium transition-colors">
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
