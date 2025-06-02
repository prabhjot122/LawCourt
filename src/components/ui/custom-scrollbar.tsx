import React from 'react';
import { cn } from '@/lib/utils';

export type ScrollbarVariant = 'default' | 'thin' | 'wide' | 'hover' | 'legal' | 'hidden';

interface CustomScrollbarProps {
  children: React.ReactNode;
  variant?: ScrollbarVariant;
  className?: string;
  maxHeight?: string;
}

/**
 * CustomScrollbar component provides aesthetic scrollbar styling
 * that matches the black and white theme of the LawFort project.
 *
 * Variants:
 * - default: Standard 8px scrollbar with gradient styling
 * - thin: Compact 6px scrollbar for tight spaces
 * - wide: Prominent 12px scrollbar for main content areas
 * - hover: Invisible scrollbar that appears on hover
 * - legal: Professional legal document style with enhanced borders
 * - hidden: Completely hidden scrollbar (like homepage/sidebar)
 */
const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  children,
  variant = 'default',
  className,
  maxHeight = 'auto'
}) => {
  const getScrollbarClass = (variant: ScrollbarVariant): string => {
    switch (variant) {
      case 'thin':
        return 'scrollbar-thin';
      case 'wide':
        return 'scrollbar-wide';
      case 'hover':
        return 'scrollbar-hover';
      case 'legal':
        return 'scrollbar-legal';
      case 'hidden':
        return 'scrollbar-hidden';
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(
        'overflow-auto',
        getScrollbarClass(variant),
        className
      )}
      style={{ maxHeight }}
    >
      {children}
    </div>
  );
};

export default CustomScrollbar;

// Export individual scrollbar utility classes for direct use
export const scrollbarClasses = {
  default: '',
  thin: 'scrollbar-thin',
  wide: 'scrollbar-wide',
  hover: 'scrollbar-hover',
  legal: 'scrollbar-legal',
  hidden: 'scrollbar-hidden'
} as const;
