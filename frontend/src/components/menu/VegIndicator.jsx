import React from 'react';

export const VegIndicator = ({ isVeg, size = 'sm', className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4 p-[2px]',
    md: 'w-5 h-5 p-[3px]',
    lg: 'w-6 h-6 p-1',
  };

  const dotSizeMap = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div
      className={`
        inline-flex items-center justify-center shrink-0 border-2 rounded-md bg-white
        ${isVeg ? 'border-food-veg' : 'border-food-nonveg'}
        ${sizeMap[size] || sizeMap.sm}
        ${className}
      `}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      aria-label={isVeg ? 'Vegetarian dish' : 'Non-Vegetarian dish'}
    >
      <div
        className={`
          rounded-full
          ${isVeg ? 'bg-food-veg' : 'bg-food-nonveg'}
          ${dotSizeMap[size] || dotSizeMap.sm}
        `}
      />
    </div>
  );
};
