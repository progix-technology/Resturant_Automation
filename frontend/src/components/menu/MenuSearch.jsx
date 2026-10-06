import React from 'react';
import { Search, X } from 'lucide-react';

export const MenuSearch = ({
  searchQuery = '',
  onSearchChange,
  placeholder = 'Search dishes, starters, biryani...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3.5 flex items-center pointer-events-none text-charcoal-400">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-10 rounded-2xl bg-white border border-warm-300/80 text-sm font-medium text-charcoal-900 placeholder:text-charcoal-400 shadow-2xs focus:outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-100 transition-all"
      />

      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="absolute right-3 p-1 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
