import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Scale } from 'lucide-react';

interface ProfessionalLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  variant?: 'spinner' | 'scales' | 'dots';
}

const ProfessionalLoading: React.FC<ProfessionalLoadingProps> = ({
  size = 'md',
  text = 'Loading...',
  className,
  variant = 'spinner'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderSpinner = () => (
    <Loader2 className={cn('animate-spin text-legal-navy', sizeClasses[size])} />
  );

  const renderScales = () => (
    <Scale className={cn('animate-pulse text-legal-gold', sizeClasses[size])} />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-legal-navy animate-bounce',
            size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'scales':
        return renderScales();
      case 'dots':
        return renderDots();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-3',
      className
    )}>
      {renderLoader()}
      {text && (
        <p className={cn(
          'text-legal-gray font-medium',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default ProfessionalLoading;
