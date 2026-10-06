import React, { useState } from 'react';
import { Utensils } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';

export const FoodImage = ({
  src,
  alt = 'Food item',
  className = '',
  imgClassName = '',
  aspectRatio = 'aspect-square',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-warm-200 ${aspectRatio} ${className}`}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-warm-200 text-charcoal-400 p-2 text-center">
          <Utensils className="w-6 h-6 stroke-1 mb-1" />
          <span className="text-[10px] font-medium leading-none">Food item</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${loaded ? 'opacity-100' : 'opacity-0'}
            ${imgClassName}
          `}
        />
      )}
    </div>
  );
};
