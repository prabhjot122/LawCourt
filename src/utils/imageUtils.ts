/**
 * Image utility functions for LawFort application
 * Handles image URL mapping and fallbacks for better user experience
 */

// Legal-themed Unsplash images for different content types
const LEGAL_IMAGES = {
  // Blog post images
  'constitutional-digital': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop&crop=center',
  'contract-law': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=center',
  'corporate-governance': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop&crop=center',
  'climate-litigation': 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=800&h=400&fit=crop&crop=center',
  
  // Course images
  'constitutional-law': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop&crop=center',
  'corporate-law': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=center',
  
  // Job images
  'corporate-law-associate': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop&crop=center',
  'environmental-attorney': 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=800&h=400&fit=crop&crop=center',
  
  // Internship images
  'corporate-law-summer': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop&crop=center',
  'environmental-research': 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=800&h=400&fit=crop&crop=center',
  
  // Research paper images
  'ai-legal-decisions': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop&crop=center',
  'blockchain-securities': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop&crop=center',
  
  // Default fallback images by category
  'default-blog': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop&crop=center',
  'default-course': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=center',
  'default-job': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop&crop=center',
  'default-internship': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop&crop=center',
  'default-research': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop&crop=center',
  'default-note': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=center',
};

/**
 * Maps placeholder image paths to real Unsplash images
 * @param imagePath - The original image path from the database
 * @param contentType - The type of content (blog, course, job, etc.)
 * @returns Real Unsplash image URL
 */
export function getImageUrl(imagePath: string | null | undefined, contentType: string = 'blog'): string {
  // If no image path provided, return default for content type
  if (!imagePath) {
    return LEGAL_IMAGES[`default-${contentType}`] || LEGAL_IMAGES['default-blog'];
  }

  // If it's already a full URL (starts with http), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Extract filename from path and map to real image
  const filename = imagePath.split('/').pop()?.replace('.jpg', '').replace('.png', '') || '';
  
  // Try to find specific mapping
  if (LEGAL_IMAGES[filename]) {
    return LEGAL_IMAGES[filename];
  }

  // Try to find by content type keywords
  const lowerFilename = filename.toLowerCase();
  for (const [key, url] of Object.entries(LEGAL_IMAGES)) {
    if (lowerFilename.includes(key.split('-')[0])) {
      return url;
    }
  }

  // Return default for content type
  return LEGAL_IMAGES[`default-${contentType}`] || LEGAL_IMAGES['default-blog'];
}

/**
 * Handles image loading errors by providing fallback images
 * @param event - The error event from img onError
 * @param contentType - The type of content for appropriate fallback
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>, contentType: string = 'blog'): void {
  const target = event.target as HTMLImageElement;
  const fallbackUrl = LEGAL_IMAGES[`default-${contentType}`] || LEGAL_IMAGES['default-blog'];
  
  // Prevent infinite loop if fallback also fails
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
}

/**
 * Gets optimized image URL with specific dimensions
 * @param imagePath - The original image path
 * @param width - Desired width
 * @param height - Desired height
 * @param contentType - Content type for fallback
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  imagePath: string | null | undefined, 
  width: number = 800, 
  height: number = 400, 
  contentType: string = 'blog'
): string {
  const baseUrl = getImageUrl(imagePath, contentType);
  
  // If it's an Unsplash URL, add optimization parameters
  if (baseUrl.includes('unsplash.com')) {
    return `${baseUrl.split('?')[0]}?w=${width}&h=${height}&fit=crop&crop=center`;
  }
  
  return baseUrl;
}

/**
 * Preloads an image to improve user experience
 * @param imageUrl - URL of the image to preload
 * @returns Promise that resolves when image is loaded
 */
export function preloadImage(imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Gets a placeholder image URL for loading states
 * @param width - Width of placeholder
 * @param height - Height of placeholder
 * @returns Placeholder image URL
 */
export function getPlaceholderImage(width: number = 800, height: number = 400): string {
  return `https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=${width}&h=${height}&fit=crop&crop=center&blur=10`;
}
