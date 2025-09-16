import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const variantClasses = {
  default: 'border-purple-500 border-t-transparent',
  primary: 'border-blue-500 border-t-transparent',
  secondary: 'border-slate-500 border-t-transparent'
};

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className = '',
  variant = 'default'
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 ${sizeClasses[size]} ${variantClasses[variant]}`}
      />
      {text && (
        <p className="text-slate-400 text-sm mt-2">{text}</p>
      )}
    </div>
  );
}

export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function TableLoader({ text = "Loading data..." }: { text?: string }) {
  return (
    <div className="py-12 flex items-center justify-center">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

export function CardLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="p-6 flex items-center justify-center">
      <LoadingSpinner size="sm" text={text} />
    </div>
  );
}
