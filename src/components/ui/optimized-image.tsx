import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  placeholder?: 'blur' | 'skeleton' | 'none';
  blurDataURL?: string;
  lazy?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  placeholder = 'skeleton',
  blurDataURL,
  lazy = true,
  aspectRatio,
  objectFit = 'cover',
  quality = 75,
  sizes,
  priority = false,
  onLoad,
  onError,
  className,
  style,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  // Generate responsive image URLs (placeholder for actual implementation)
  const generateSrcSet = (baseSrc: string) => {
    // In a real implementation, you'd generate different sizes
    // For now, we'll just return the original src
    return baseSrc;
  };

  // Calculate aspect ratio styles
  const getAspectRatioStyles = () => {
    if (!aspectRatio) return {};

    const ratios = {
      square: '1 / 1',
      video: '16 / 9',
      portrait: '3 / 4',
      landscape: '4 / 3',
    };

    const ratio = typeof aspectRatio === 'number' 
      ? `${aspectRatio} / 1` 
      : ratios[aspectRatio];

    return {
      aspectRatio: ratio,
    };
  };

  const containerStyles = {
    ...getAspectRatioStyles(),
    ...style,
  };

  const imageStyles = {
    objectFit,
  };

  // Show placeholder while not in view or loading
  if (!isInView || (isLoading && placeholder !== 'none')) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden bg-muted',
          className
        )}
        style={containerStyles}
      >
        {placeholder === 'skeleton' && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        {placeholder === 'blur' && blurDataURL && (
          <img
            src={blurDataURL}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  // Show fallback image on error
  if (hasError && fallbackSrc) {
    return (
      <div
        className={cn(
          'relative overflow-hidden',
          className
        )}
        style={containerStyles}
      >
        <img
          src={fallbackSrc}
          alt={alt}
          className="w-full h-full"
          style={imageStyles}
          {...props}
        />
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div
        className={cn(
          'relative overflow-hidden bg-muted flex items-center justify-center',
          className
        )}
        style={containerStyles}
      >
        <div className="text-muted-foreground text-sm">
          Failed to load image
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={containerStyles}
    >
      {/* Loading placeholder */}
      {isLoading && placeholder !== 'none' && (
        <div className="absolute inset-0">
          {placeholder === 'skeleton' && (
            <Skeleton className="w-full h-full" />
          )}
          {placeholder === 'blur' && blurDataURL && (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-110"
              aria-hidden="true"
            />
          )}
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={src}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        style={imageStyles}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        {...props}
      />
    </div>
  );
};

// Avatar component with optimized image
export const OptimizedAvatar: React.FC<{
  src?: string;
  alt: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({
  src,
  alt,
  fallback,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  if (!src) {
    return (
      <div className={cn(
        'rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium',
        sizeClasses[size],
        className
      )}>
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="square"
      className={cn(
        'rounded-full',
        sizeClasses[size],
        className
      )}
      placeholder="skeleton"
    />
  );
};

export default OptimizedImage;
