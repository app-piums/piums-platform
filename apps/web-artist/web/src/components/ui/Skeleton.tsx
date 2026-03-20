import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const skeletonElement = (
    <div
      className={`
        bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200
        animate-pulse
        ${variants[variant]}
        ${className}
      `}
      style={{
        width: width || (variant === 'text' ? '100%' : variant === 'circular' ? '40px' : '100%'),
        height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '100px'),
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-2">
          {skeletonElement}
        </div>
      ))}
    </>
  );
};

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${className}`}>
    <Skeleton variant="rectangular" height={200} className="mb-4" />
    <Skeleton variant="text" width="60%" className="mb-2" />
    <Skeleton variant="text" width="80%" className="mb-2" />
    <Skeleton variant="text" width="40%" />
  </div>
);

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 3, className = '' }) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="40%" className="mb-2" />
          <Skeleton variant="text" width="80%" />
        </div>
      </div>
    ))}
  </div>
);
