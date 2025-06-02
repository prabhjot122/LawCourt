import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className,
  delay = 0 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { preferences } = useUserPreferences();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (preferences.reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4',
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageTransition;
