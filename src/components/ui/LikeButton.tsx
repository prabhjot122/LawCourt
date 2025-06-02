import React from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLike } from '@/hooks/useLike';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LikeButtonProps {
  contentId: number;
  variant?: 'default' | 'minimal' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

/**
 * LikeButton component provides like/unlike functionality for content
 * with different visual variants and sizes
 */
const LikeButton: React.FC<LikeButtonProps> = ({
  contentId,
  variant = 'default',
  size = 'md',
  showCount = true,
  className
}) => {
  const { user } = useAuth();
  const { isLiked, likeCount, isLoading, error, toggleLike, clearError } = useLike(contentId);

  // Show error toast when error occurs
  React.useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleClick = async () => {
    if (!user) {
      toast.error('Please log in to like content');
      return;
    }
    
    await toggleLike();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-2 text-xs';
      case 'lg':
        return 'h-12 px-6 text-base';
      default:
        return 'h-10 px-4 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 20;
      default:
        return 16;
    }
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors duration-200',
          isLiked && 'text-red-500',
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        {isLoading ? (
          <Loader2 size={getIconSize()} className="animate-spin" />
        ) : (
          <Heart
            size={getIconSize()}
            className={cn(
              'transition-all duration-200',
              isLiked ? 'fill-current text-red-500' : 'hover:fill-current hover:text-red-500'
            )}
          />
        )}
        {showCount && (
          <span className={cn(
            'font-medium transition-colors duration-200',
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
          )}>
            {likeCount}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1 h-8 px-2 text-gray-600 hover:text-red-500 hover:bg-red-50',
          isLiked && 'text-red-500 bg-red-50',
          className
        )}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Heart
            size={14}
            className={cn(
              'transition-all duration-200',
              isLiked && 'fill-current'
            )}
          />
        )}
        {showCount && <span className="text-xs font-medium">{likeCount}</span>}
      </Button>
    );
  }

  // Default variant
  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2 transition-all duration-200',
        getSizeClasses(),
        isLiked 
          ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
          : 'border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 hover:bg-red-50',
        className
      )}
    >
      {isLoading ? (
        <Loader2 size={getIconSize()} className="animate-spin" />
      ) : (
        <Heart
          size={getIconSize()}
          className={cn(
            'transition-all duration-200',
            isLiked && 'fill-current'
          )}
        />
      )}
      <span className="font-medium">
        {isLiked ? 'Liked' : 'Like'}
        {showCount && ` (${likeCount})`}
      </span>
    </Button>
  );
};

export default LikeButton;
