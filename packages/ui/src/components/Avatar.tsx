import React from 'react';

// ============================================================================
// @piums/ui — Avatar component
// ============================================================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs:  'h-6 w-6 text-xs',
  sm:  'h-8 w-8 text-sm',
  md:  'h-10 w-10 text-sm',
  lg:  'h-12 w-12 text-base',
  xl:  'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-2xl',
};

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  online?: boolean;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0]?.charAt(0).toUpperCase() ?? '?';
  return `${words[0]?.charAt(0) ?? ''}${words[words.length - 1]?.charAt(0) ?? ''}`.toUpperCase();
}

const COLORS = [
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-blue-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-orange-500',
];

function nameToColor(name?: string): string {
  if (!name) return COLORS[0]!;
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx]!;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  online,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const showFallback = !src || imgError;

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      <div
        className={[
          'overflow-hidden rounded-full',
          SIZE_CLASSES[size],
          showFallback ? `${nameToColor(name)} flex items-center justify-center font-semibold text-white` : '',
        ].join(' ')}
      >
        {showFallback ? (
          <span aria-hidden="true">{getInitials(name)}</span>
        ) : (
          <img
            src={src!}
            alt={alt ?? name ?? 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      {online !== undefined && (
        <span
          className={[
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
            online ? 'bg-green-400' : 'bg-gray-400',
          ].join(' ')}
          aria-label={online ? 'En línea' : 'Desconectado'}
        />
      )}
    </div>
  );
};
