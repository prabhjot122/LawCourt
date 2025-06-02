import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, handleImageError } from '@/utils/imageUtils';

interface EnhancedImageProps {
  src?: string | null;
  alt: string;
  contentType?: 'blog' | 'course' | 'job' | 'internship' | 'research' | 'note';
  width?: number;
  height?: number;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'wide';
  showOverlay?: boolean;
  overlayContent?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

const EnhancedImage: React.FC<EnhancedImageProps> = ({
  src,
  alt,
  contentType = 'blog',
  width = 800,
  height = 400,
  className,
  aspectRatio = 'video',
  showOverlay = false,
  overlayContent,
  loading = 'lazy',
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]',
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(true);
    handleImageError(e, contentType);
    onError?.();
  };

  const optimizedSrc = getOptimizedImageUrl(src, width, height, contentType);

  return (
    <div className={cn(
      'relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg',
      aspectRatioClasses[aspectRatio],
      className
    )}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
      )}

      {/* Main image */}
      <img
        src={optimizedSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100'
        )}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Overlay */}
      {showOverlay && overlayContent && (
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
            {overlayContent}
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedImage;
