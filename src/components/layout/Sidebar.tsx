import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  FileText,
  StickyNote,
  GraduationCap,
  Briefcase,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  Home,
  X,
  Shield,
  PenTool,
  UserCheck,
  Bookmark,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navigation: NavigationItem[] = [
    // Dashboard - Users only get user dashboard
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: [UserRole.USER],
    },
    // Editors and Admins get editor dashboard
    {
      name: 'Dashboard',
      href: '/editor-dashboard',
      icon: PenTool,
      roles: [UserRole.EDITOR, UserRole.ADMIN],
    },
    {
      name: 'Admin Panel',
      href: '/admin',
      icon: Shield,
      roles: [UserRole.ADMIN],
    },

    // Content Management
    {
      name: 'Blog Posts',
      href: '/blogs',
      icon: BookOpen,
      roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    },
    {
      name: 'Research Papers',
      href: '/research',
      icon: FileText,
      roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    },
    {
      name: 'Notes',
      href: '/notes',
      icon: StickyNote,
      roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    },
    {
      name: 'Courses',
      href: '/courses',
      icon: GraduationCap,
      roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    },
    {
      name: 'Personal Library',
      href: '/library',
      icon: Bookmark,
      roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    },

    // Career
    {
      name: 'Jobs',
      href: '/jobs',
      icon: Briefcase,
      roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    },
    {
      name: 'Internships',
      href: '/internships',
      icon: Users,
      roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    },
    {
      name: 'Applications',
      href: '/applications',
      icon: ClipboardList,
      roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    },
    {
      name: 'Manage Applications',
      href: '/manage-applications',
      icon: UserCheck,
      roles: [UserRole.EDITOR, UserRole.ADMIN],
    },

    // Profile
    {
      name: 'Profile',
      href: '/profile',
      icon: Settings,
      roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    },
  ];

  const filteredNavigation = navigation.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Black & White Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="sidebar-container flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-300 px-6 pb-4 shadow-xl">
          <div className="flex h-16 shrink-0 items-center">
            <Link to="/" className="flex items-center space-x-3 professional-hover-lift">
              <div className="h-10 w-10 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center shadow-lg border border-gray-300">
                <span className="text-white font-bold text-lg">LF</span>
              </div>
              <span className="text-xl font-bold text-black legal-heading">LawFort</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          location.pathname === item.href
                            ? 'bg-gray-100 text-black shadow-md border-l-4 border-black'
                            : 'text-gray-700 hover:text-black hover:bg-gray-50',
                          'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all duration-200 professional-hover-lift'
                        )}
                      >
                        <item.icon
                          className={cn(
                            location.pathname === item.href
                              ? 'text-black'
                              : 'text-gray-500 group-hover:text-black',
                            'h-5 w-5 shrink-0 transition-colors duration-200'
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded-full font-medium border border-gray-300">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Black & White Mobile sidebar */}
      <div className={cn(
        'fixed inset-y-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:hidden',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="sidebar-container flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-300 px-6 pb-4 shadow-xl">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 professional-hover-lift" onClick={onClose}>
              <div className="h-10 w-10 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center shadow-lg border border-gray-300">
                <span className="text-white font-bold text-lg">LF</span>
              </div>
              <span className="text-xl font-bold text-black legal-heading">LawFort</span>
            </Link>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black transition-colors duration-200 professional-hover-lift"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          location.pathname === item.href
                            ? 'bg-gray-100 text-black shadow-md border-l-4 border-black'
                            : 'text-gray-700 hover:text-black hover:bg-gray-50',
                          'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all duration-200 professional-hover-lift'
                        )}
                      >
                        <item.icon
                          className={cn(
                            location.pathname === item.href
                              ? 'text-black'
                              : 'text-gray-500 group-hover:text-black',
                            'h-5 w-5 shrink-0 transition-colors duration-200'
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded-full font-medium border border-gray-300">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
