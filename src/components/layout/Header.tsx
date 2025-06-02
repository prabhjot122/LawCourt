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
  Menu,
  User,
  Settings,
  LogOut,
  Plus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface HeaderProps {
  onMenuClick: () => void;
  user: any;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };



  const canCreateContent = user && (user.role === UserRole.EDITOR || user.role === UserRole.ADMIN);

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-300 bg-white px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 hover:text-black transition-colors duration-200 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-300 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-8 justify-end">

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Create content button for editors/admins */}
          {canCreateContent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2 bg-black hover:bg-gray-800 text-white shadow-md border border-gray-300">
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border border-gray-300">
                <DropdownMenuLabel className="text-black">Create Content</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem asChild className="hover:bg-gray-100">
                  <Link to="/blogs/create" className="text-gray-700">Blog Post</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-gray-100">
                  <Link to="/jobs/create" className="text-gray-700">Job Posting</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-gray-100">
                  <Link to="/internships/create" className="text-gray-700">Internship</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-gray-100">
                  <Link to="/notes/create" className="text-gray-700">Note</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notifications */}
          <NotificationDropdown />

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"
            aria-hidden="true"
          />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="-m-1.5 flex items-center p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <span className="sr-only">Open user menu</span>
                <Avatar className="h-9 w-9 ring-2 ring-gray-300">
                  <AvatarImage src={user?.profilePic} alt={user?.fullName} />
                  <AvatarFallback className="bg-black text-white font-semibold">
                    {user?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:flex lg:items-center">
                  <span
                    className="ml-4 text-sm font-semibold leading-6 text-black"
                    aria-hidden="true"
                  >
                    {user?.fullName}
                  </span>
                  <Badge
                    className="ml-2 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300"
                    variant="secondary"
                  >
                    {user?.role}
                  </Badge>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border border-gray-300">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-black">{user?.fullName}</p>
                  <p className="text-xs leading-none text-gray-600">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem asChild className="hover:bg-gray-100">
                <Link to="/profile" className="flex items-center text-gray-700">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-gray-100">
                <Link to="/dashboard" className="flex items-center text-gray-700">
                  <Settings className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              {user?.role === UserRole.EDITOR && (
                <DropdownMenuItem asChild className="hover:bg-gray-100">
                  <Link to="/editor-dashboard" className="flex items-center text-gray-700">
                    <Settings className="mr-2 h-4 w-4" />
                    Editor Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              {user?.role === UserRole.ADMIN && (
                <DropdownMenuItem asChild className="hover:bg-gray-100">
                  <Link to="/admin" className="flex items-center text-gray-700">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center text-gray-700 hover:bg-gray-100">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;
