import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AuthHeader = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on the index/home page
  const isHomePage = location.pathname === '/';

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

  // Function to get initials from full name
  const getInitials = (name: string) => {
    return name
      ? name
          .split(' ')
          .map(part => part[0])
          .join('')
          .toUpperCase()
      : '';
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-white/80 shadow-md backdrop-blur-sm py-4" : "bg-transparent py-6"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="w-8 h-8 bg-golden-500 rounded-full flex items-center justify-center mr-2">
              <div className="w-6 h-0.5 bg-white rounded-full" />
            </div>
            <span className={cn(
              "font-bold text-xl transition-colors",
              isScrolled ? "text-courtroom-dark" : isHomePage ? "text-white" : "text-courtroom-dark"
            )}>
              Law Court
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={cn(
                "font-medium transition-colors story-link",
                isScrolled ? "text-courtroom-dark" : isHomePage ? "text-white" : "text-courtroom-dark"
              )}
            >
              Home
            </Link>
            <a
              href="#resources"
              className={cn(
                "font-medium transition-colors story-link",
                isScrolled ? "text-courtroom-dark" : isHomePage ? "text-white" : "text-courtroom-dark"
              )}
            >
              Resources
            </a>
            <a
              href="#community"
              className={cn(
                "font-medium transition-colors story-link",
                isScrolled ? "text-courtroom-dark" : isHomePage ? "text-white" : "text-courtroom-dark"
              )}
            >
              Community
            </a>
            <a
              href="#career"
              className={cn(
                "font-medium transition-colors story-link",
                isScrolled ? "text-courtroom-dark" : isHomePage ? "text-white" : "text-courtroom-dark"
              )}
            >
              Career
            </a>
            <a
              href="#events"
              className={cn(
                "font-medium transition-colors story-link",
                isScrolled ? "text-courtroom-dark" : isHomePage ? "text-white" : "text-courtroom-dark"
              )}
            >
              Events
            </a>
          </nav>

          {/* Auth Buttons or User Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profilePhoto} alt={user.fullName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-medium text-sm">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  {user.role === 'Admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={logout}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button className="bg-golden-500 hover:bg-golden-600 text-white" onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              "md:hidden focus:outline-none",
              isScrolled ? "text-courtroom-dark" : isHomePage ? "text-white" : "text-courtroom-dark"
            )}
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
              <Link
                to="/"
                className="px-4 py-2 text-courtroom-dark hover:bg-golden-50 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
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

              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/profile"
                    className="px-4 py-2 text-courtroom-dark hover:bg-golden-50 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {user.role === 'Admin' && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 text-courtroom-dark hover:bg-golden-50 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    className="px-4 py-2 text-destructive hover:bg-golden-50 font-medium text-left"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-courtroom-dark hover:bg-golden-50 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <div className="px-4 pt-2">
                    <Button
                      className="w-full bg-golden-500 hover:bg-golden-600 text-white px-6 py-2 rounded-full font-medium transition-colors"
                      onClick={() => navigate('/signup')}
                    >
                      Sign Up
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AuthHeader;
