import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

type AnimationType = 
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleIn'
  | 'rotateIn'
  | 'bounceIn'
  | 'none';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: AnimationType;
  duration?: number;
  delay?: number;
  threshold?: number;
  triggerOnce?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = 'fadeIn',
  duration = 600,
  delay = 0,
  threshold = 0.1,
  triggerOnce = true,
  className,
  style,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const { preferences } = useUserPreferences();

  // Disable animations if user prefers reduced motion
  const shouldAnimate = !preferences.reducedMotion && animation !== 'none';

  useEffect(() => {
    if (!shouldAnimate) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasTriggered(true);
          
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce && hasTriggered) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '50px',
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [shouldAnimate, threshold, triggerOnce, hasTriggered]);

  const getAnimationClasses = () => {
    if (!shouldAnimate) return '';

    const baseClasses = 'transition-all ease-out';
    
    const animationClasses = {
      fadeIn: isVisible 
        ? 'opacity-100' 
        : 'opacity-0',
      slideUp: isVisible 
        ? 'opacity-100 translate-y-0' 
        : 'opacity-0 translate-y-8',
      slideDown: isVisible 
        ? 'opacity-100 translate-y-0' 
        : 'opacity-0 -translate-y-8',
      slideLeft: isVisible 
        ? 'opacity-100 translate-x-0' 
        : 'opacity-0 translate-x-8',
      slideRight: isVisible 
        ? 'opacity-100 translate-x-0' 
        : 'opacity-0 -translate-x-8',
      scaleIn: isVisible 
        ? 'opacity-100 scale-100' 
        : 'opacity-0 scale-95',
      rotateIn: isVisible 
        ? 'opacity-100 rotate-0' 
        : 'opacity-0 -rotate-12',
      bounceIn: isVisible 
        ? 'opacity-100 scale-100' 
        : 'opacity-0 scale-75',
      none: '',
    };

    return cn(baseClasses, animationClasses[animation]);
  };

  const animationStyle = shouldAnimate ? {
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
    ...style,
  } : style;

  return (
    <div
      ref={elementRef}
      className={cn(getAnimationClasses(), className)}
      style={animationStyle}
    >
      {children}
    </div>
  );
};

// Stagger animation for lists
interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animation?: AnimationType;
  className?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 100,
  animation = 'slideUp',
  className,
}) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedWrapper
          key={index}
          animation={animation}
          delay={index * staggerDelay}
          triggerOnce={true}
        >
          {child}
        </AnimatedWrapper>
      ))}
    </div>
  );
};

// Page transition wrapper
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <AnimatedWrapper
      animation="fadeIn"
      duration={300}
      triggerOnce={false}
      className={className}
    >
      {children}
    </AnimatedWrapper>
  );
};

// Hover animation wrapper
interface HoverAnimationProps {
  children: React.ReactNode;
  scale?: number;
  lift?: boolean;
  glow?: boolean;
  className?: string;
}

export const HoverAnimation: React.FC<HoverAnimationProps> = ({
  children,
  scale = 1.05,
  lift = false,
  glow = false,
  className,
}) => {
  const { preferences } = useUserPreferences();
  
  if (preferences.reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-out cursor-pointer',
        lift && 'hover:shadow-lg hover:-translate-y-1',
        glow && 'hover:shadow-xl hover:shadow-primary/20',
        className
      )}
      style={{
        '--hover-scale': scale,
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        if (!preferences.reducedMotion) {
          e.currentTarget.style.transform = `scale(${scale})`;
        }
      }}
      onMouseLeave={(e) => {
        if (!preferences.reducedMotion) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedWrapper;
