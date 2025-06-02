import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  ExternalLink,
  BriefcaseIcon,
  FileTextIcon,
  UserCheckIcon,
  UserXIcon,
  MessageSquareIcon,
  BookmarkIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const NotificationDropdown: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();

  const { user } = useAuth();
  const location = useLocation();

  // Check if we're on the index/home page and if scrolled
  const isHomePage = location.pathname === '/';
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
      case 'application_status':
        return <BriefcaseIcon className="h-4 w-4 text-blue-600" />;
      case 'content_comment':
        return <MessageSquareIcon className="h-4 w-4 text-green-600" />;
      case 'content_saved':
        return <BookmarkIcon className="h-4 w-4 text-purple-600" />;
      case 'access_request':
        return <AlertCircleIcon className="h-4 w-4 text-orange-600" />;
      case 'access_approved':
        return <UserCheckIcon className="h-4 w-4 text-green-600" />;
      case 'access_denied':
        return <UserXIcon className="h-4 w-4 text-red-600" />;
      default:
        return <FileTextIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.Is_Read) {
      await markAsRead(notification.Notification_ID);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    await removeNotification(notificationId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative transition-all duration-300 hover:scale-105",
            isScrolled || !isHomePage
              ? "text-black hover:text-gray-600 hover:bg-gray-100"
              : "text-white hover:text-gray-300 hover:bg-white/10"
          )}
        >
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center animate-pulse shadow-lg"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-xl p-0 mt-2"
        sideOffset={8}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-700" />
              <span className="font-semibold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-black text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-auto px-2 py-1 text-xs text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
              <span className="text-sm text-gray-500 font-medium">Loading notifications...</span>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="p-3 bg-gray-100 rounded-full mb-3">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">You'll see updates here when they arrive</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div
                  key={notification.Notification_ID}
                  className={cn(
                    "group relative p-3 mx-2 mb-2 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md",
                    !notification.Is_Read
                      ? "bg-blue-50/50 border-blue-200 hover:bg-blue-50"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.Action_URL ? (
                    <Link
                      to={notification.Action_URL}
                      className="block w-full"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                          {getNotificationIcon(notification.Type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 leading-tight">
                                {notification.Title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                {notification.Message}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!notification.Is_Read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              )}
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400 font-medium">
                              {formatDistanceToNow(new Date(notification.Created_At), { addSuffix: true })}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteNotification(e, notification.Notification_ID)}
                              className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                        {getNotificationIcon(notification.Type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                              {notification.Title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                              {notification.Message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.Is_Read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400 font-medium">
                            {formatDistanceToNow(new Date(notification.Created_At), { addSuffix: true })}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteNotification(e, notification.Notification_ID)}
                            className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500 text-center">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
