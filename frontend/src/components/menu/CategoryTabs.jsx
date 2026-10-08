import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CategoryTabs = ({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  className = '',
}) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const timeout = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  const handleScrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
  };

  return (
    <div className={`relative flex items-center gap-1.5 ${className}`}>
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={handleScrollLeft}
          aria-label="Scroll left categories"
          className="shrink-0 w-8 h-8 rounded-full bg-white text-brand-800 border border-warm-300 shadow-md flex items-center justify-center hover:bg-brand-50 active:scale-95 transition-all z-10 select-none cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* Category Pills Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="overflow-x-auto no-scrollbar py-2 px-1 flex items-center gap-2 scroll-smooth flex-1"
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`
                whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 shrink-0 select-none cursor-pointer
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

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={handleScrollRight}
          aria-label="Scroll right categories"
          className="shrink-0 w-8 h-8 rounded-full bg-white text-brand-800 border border-warm-300 shadow-md flex items-center justify-center hover:bg-brand-50 active:scale-95 transition-all z-10 select-none cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
