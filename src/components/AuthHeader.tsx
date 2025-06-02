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
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { Search } from 'lucide-react';

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
      isScrolled || !isHomePage ? "bg-white/95 shadow-lg backdrop-blur-sm py-4 border-b border-gray-200" : "bg-transparent py-6"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="h-10 w-10 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center mr-3 shadow-lg border border-gray-300 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-lg">LF</span>
            </div>
            <span className={cn(
              "font-bold text-xl transition-colors legal-heading",
              isScrolled || !isHomePage ? "text-black" : "text-white"
            )}>
              LawFort
            </span>
          </Link>

          {/* Desktop Mega Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={cn(
                "font-medium transition-colors hover:text-gray-600 legal-text",
                isScrolled || !isHomePage ? "text-black" : "text-white"
              )}
            >
              Home
            </Link>

            {isAuthenticated && user && (
              <Link
                to={user.role === 'User' ? '/dashboard' : '/editor-dashboard'}
                className={cn(
                  "font-medium transition-colors hover:text-gray-600 legal-text",
                  isScrolled || !isHomePage ? "text-black" : "text-white"
                )}
              >
                Dashboard
              </Link>
            )}

            {/* Publications Mega Menu */}
            <div className="relative group">
              <button
                className={cn(
                  "font-medium transition-colors hover:text-gray-600 legal-text flex items-center",
                  isScrolled || !isHomePage ? "text-black" : "text-white"
                )}
              >
                Publications
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="p-4">
                  <Link
                    to="/blogs"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group/item"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover/item:text-blue-600">Blog Posts</div>
                      <div className="text-sm text-gray-500">Legal articles and insights</div>
                    </div>
                  </Link>

                  <Link
                    to="/research"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group/item"
                  >
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover/item:text-green-600">Research Papers</div>
                      <div className="text-sm text-gray-500">Academic legal research</div>
                    </div>
                  </Link>

                  <Link
                    to="/notes"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group/item"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover/item:text-purple-600">Notes</div>
                      <div className="text-sm text-gray-500">Quick insights and tips</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Resources Mega Menu */}
            <div className="relative group">
              <button
                className={cn(
                  "font-medium transition-colors hover:text-gray-600 legal-text flex items-center",
                  isScrolled || !isHomePage ? "text-black" : "text-white"
                )}
              >
                Resources
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="p-4">
                  <Link
                    to="/courses"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group/item"
                  >
                    <div className="p-2 bg-orange-100 rounded-lg mr-3">
                      <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover/item:text-orange-600">Courses</div>
                      <div className="text-sm text-gray-500">Legal education programs</div>
                    </div>
                  </Link>

                  {isAuthenticated && (
                    <Link
                      to="/library"
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group/item"
                    >
                      <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                        <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover/item:text-indigo-600">My Library</div>
                        <div className="text-sm text-gray-500">Saved content and bookmarks</div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Career Mega Menu */}
            <div className="relative group">
              <button
                className={cn(
                  "font-medium transition-colors hover:text-gray-600 legal-text flex items-center",
                  isScrolled || !isHomePage ? "text-black" : "text-white"
                )}
              >
                Career
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="p-4">
                  <Link
                    to="/jobs"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group/item"
                  >
                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                      <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover/item:text-red-600">Job Opportunities</div>
                      <div className="text-sm text-gray-500">Legal career positions</div>
                    </div>
                  </Link>

                  <Link
                    to="/internships"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group/item"
                  >
                    <div className="p-2 bg-teal-100 rounded-lg mr-3">
                      <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover/item:text-teal-600">Internships</div>
                      <div className="text-sm text-gray-500">Legal internship programs</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Auth Buttons or User Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Search Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    "transition-colors",
                    isScrolled || !isHomePage ? "text-black hover:text-gray-600" : "text-white hover:text-gray-300"
                  )}
                >
                  <Link to="/search">
                    <Search className="h-5 w-5" />
                  </Link>
                </Button>

                {/* Notifications */}
                <NotificationDropdown />

                {/* User Profile */}
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
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/applications">My Applications</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  {(user.role === 'Editor' || user.role === 'Admin') && (
                    <DropdownMenuItem asChild>
                      <Link to="/editor-dashboard">Editor Dashboard</Link>
                    </DropdownMenuItem>
                  )}
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
              </>
            ) : isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className={cn(
                    "font-medium transition-colors",
                    isScrolled || !isHomePage ? "text-black hover:text-gray-600" : "text-white hover:text-gray-300"
                  )}
                >
                  Login
                </Button>
                <Button
                  className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                  onClick={() => navigate('/signup')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              "md:hidden focus:outline-none transition-colors",
              isScrolled || !isHomePage ? "text-black hover:text-gray-600" : "text-white hover:text-gray-300"
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
          <div className="md:hidden mt-4 py-4 bg-white rounded-xl shadow-xl border border-gray-200">
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              {isAuthenticated && user ? (
                <>
                  <Link
                    to={user.role === 'User' ? '/dashboard' : '/editor-dashboard'}
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/blogs"
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Publications
                  </Link>
                  <Link
                    to="/research"
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Research
                  </Link>
                  <Link
                    to="/jobs"
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Career
                  </Link>
                  <Link
                    to="/search"
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Search
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/blogs"
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Publications
                  </Link>
                  <Link
                    to="/research"
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Research
                  </Link>
                  <Link
                    to="/jobs"
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Career
                  </Link>
                </>
              )}

              {isAuthenticated && user ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    to="/profile"
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/applications"
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Applications
                  </Link>
                  {user.role === 'Admin' && (
                    <Link
                      to="/admin"
                      className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    className="px-4 py-3 text-red-600 hover:bg-red-50 font-medium text-left w-full transition-colors legal-text"
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
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    to="/login"
                    className="px-4 py-3 text-black hover:bg-gray-50 font-medium transition-colors legal-text"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <div className="px-4 pt-2">
                    <Button
                      className="w-full bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg"
                      onClick={() => {
                        navigate('/signup');
                        setIsMobileMenuOpen(false);
                      }}
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
