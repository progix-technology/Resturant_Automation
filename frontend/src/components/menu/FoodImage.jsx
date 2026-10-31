import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';

// Helper to determine if an image URL is from Cloudinary
export const isCloudinaryImage = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  return clean.includes('cloudinary.com') || clean.includes('res.cloudinary.com');
};

export const FoodImage = ({
  src,
  alt = 'Food item',
  className = '',
  imgClassName = '',
  aspectRatio = 'aspect-square',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const isValidCloudinary = isCloudinaryImage(src);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${aspectRatio} ${className}`}>
      {!isValidCloudinary || error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center select-none">
          <div className="w-10 h-10 rounded-full bg-slate-200/80 flex items-center justify-center shadow-inner">
            <UtensilsCrossed className="w-5 h-5 text-slate-400 stroke-[1.75]" />
          </div>
        </div>
      ) : (
        <>
          {!loaded && (
            <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          )}
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
        </>
      )}
    </div>
  );
};
