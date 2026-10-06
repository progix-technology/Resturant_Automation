import React from 'react';

export const CategoryTabs = ({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto no-scrollbar py-2 px-1 -mx-1 flex items-center gap-2 ${className}`}>
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`
              whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 shrink-0 select-none
              ${isSelected
                ? 'bg-brand-800 text-white shadow-xs'
                : 'bg-white text-charcoal-700 hover:bg-warm-200 border border-warm-200/90'
              }
            `}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};
