import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  imageUrl?: string;
  imageAlt?: string;
  onClick?: () => void;
}

export default function Card({
  title,
  subtitle,
  children,
  className,
  imageUrl,
  imageAlt,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
        onClick && 'cursor-pointer card-hover',
        className
      )}
      onClick={onClick}
    >
      {imageUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={imageAlt || title || ''}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}
