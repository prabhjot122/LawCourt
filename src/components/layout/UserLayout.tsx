import React from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  FileText,
  StickyNote,
  GraduationCap,
  Briefcase,
  Users,
  ClipboardList,
  Settings,
  Home,
  User,
  LogOut,
  Bookmark,
  ChevronDown,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import PageTransition from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-gray-200 text-gray-800';
      case UserRole.EDITOR:
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  // Super navigation structure with mega menu
  const superNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      isSimple: true
    },
    {
      name: 'Publications',
      icon: BookOpen,
      isSimple: false,
      items: [
        { name: 'Blog Posts', href: '/blogs', icon: BookOpen, description: 'Read and explore legal articles' },
        { name: 'Research Papers', href: '/research', icon: FileText, description: 'Academic legal research' },
        { name: 'Notes', href: '/notes', icon: StickyNote, description: 'Quick legal notes and insights' },
      ]
    },
    {
      name: 'Resources',
      icon: GraduationCap,
      isSimple: false,
      items: [
        { name: 'Courses', href: '/courses', icon: GraduationCap, description: 'Legal education and training' },
        { name: 'Personal Library', href: '/library', icon: Bookmark, description: 'Your saved content' },
      ]
    },
    {
      name: 'Career',
      icon: Briefcase,
      isSimple: false,
      items: [
        { name: 'Jobs', href: '/jobs', icon: Briefcase, description: 'Legal job opportunities' },
        { name: 'Internships', href: '/internships', icon: Users, description: 'Legal internship programs' },
      ]
    },
    {
      name: 'Library',
      href: '/library',
      icon: Bookmark,
      isSimple: true
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Black & White Header with Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-300 shadow-lg">
        <div className=" max-w-full  sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center shadow-lg border border-gray-300">
                  <span className="text-white font-bold text-lg">LF</span>
                </div>
                <span className="text-xl font-bold text-black">LawFort</span>
              </Link>
            </div>

            {/* Modern Mega Menu Navigation */}
            <nav className="hidden lg:flex lg:items-center lg:space-x-8">
              {superNavigation.map((item) => (
                <div key={item.name} className="relative group">
                  {item.isSimple ? (
                    // Simple navigation item
                    <Link
                      to={item.href!}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 border',
                        location.pathname === item.href
                          ? 'bg-black text-white border-black shadow-lg'
                          : 'text-gray-700 hover:text-black hover:bg-gray-100 border-transparent hover:border-gray-200'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  ) : (
                    // Dropdown navigation item
                    <>
                      <button className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-300 border border-transparent hover:border-gray-200">
                        <item.icon className="h-4 w-4" />
                        {item.name}
                        <ChevronDown className="h-3 w-3 transition-transform duration-300 group-hover:rotate-180" />
                      </button>

                      {/* Mega Menu Dropdown */}
                      <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                        <div className="p-6">
                          <div className="space-y-4">
                            {item.items?.map((subItem) => (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group/item"
                              >
                                <div className="p-2 bg-gray-100 rounded-lg group-hover/item:bg-gray-200 transition-colors duration-200">
                                  <subItem.icon className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-sm font-semibold text-black group-hover/item:text-gray-800 transition-colors duration-200">
                                    {subItem.name}
                                  </h3>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {subItem.description}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </nav>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center gap-x-4">
              {/* Notifications */}
              <NotificationDropdown />

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <Avatar className="h-8 w-8 ring-2 ring-gray-300">
                      <AvatarImage src={user?.profilePic} alt={user?.fullName} />
                      <AvatarFallback className="bg-black text-white font-semibold text-sm">
                        {user?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex lg:items-center lg:ml-3">
                      <span className="text-sm font-semibold text-black">
                        {user?.fullName}
                      </span>
                      <Badge
                        className={`ml-2 text-xs font-medium ${getRoleBadgeColor(user?.role)} border border-gray-300`}
                      >
                        {user?.role}
                      </Badge>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-300">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-black">{user?.fullName}</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center text-gray-700 hover:text-black">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/applications" className="flex items-center text-gray-700 hover:text-black">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      My Applications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center text-gray-700 hover:text-black">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-gray-700 hover:text-black">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="lg:hidden border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {/* Main navigation items */}
            <div className="grid grid-cols-5 gap-1 py-3">
              {superNavigation.map((item) => (
                <div key={item.name} className="relative">
                  {item.isSimple ? (
                    <Link
                      to={item.href!}
                      className={cn(
                        'flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium rounded-lg transition-all duration-200',
                        location.pathname === item.href
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:text-black hover:bg-white'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ) : (
                    <div className="flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium text-gray-600">
                      <item.icon className="h-4 w-4" />
                      <span className="truncate">{item.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sub-navigation for mobile - show all sub-items */}
            <div className="border-t border-gray-200 pt-2 pb-3">
              <div className="grid grid-cols-2 gap-2">
                {superNavigation
                  .filter(item => !item.isSimple)
                  .flatMap(item => item.items || [])
                  .map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200',
                        location.pathname === subItem.href
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:text-black hover:bg-white'
                      )}
                    >
                      <subItem.icon className="h-3 w-3" />
                      <span className="truncate">{subItem.name}</span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-8">
        <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
};

export default UserLayout;
