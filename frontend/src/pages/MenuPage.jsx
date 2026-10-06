import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Sparkles, UtensilsCrossed } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { menuService } from '../services/menuService';
import { RestaurantBanner } from '../components/restaurant/RestaurantBanner';
import { CustomerBadge } from '../components/restaurant/CustomerBadge';
import { MenuSearch } from '../components/menu/MenuSearch';
import { CategoryTabs } from '../components/menu/CategoryTabs';
import { MenuSection } from '../components/menu/MenuSection';
import { FoodDetailsSheet } from '../components/menu/FoodDetailsSheet';
import { FoodCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const MenuPage = () => {
  const { restaurant } = useOutletContext();
  const { restaurantSlug } = useParams();
  const { session } = useSession();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active item in bottom sheet customization modal
  const [customizingItem, setCustomizingItem] = useState(null);

  useEffect(() => {
    const fetchMenuData = async () => {
      setIsLoading(true);
      try {
        const slug = restaurantSlug || restaurant?.slug || 'spice-garden';
        const [cats, items, recs] = await Promise.all([
          menuService.getCategories(),
          menuService.getMenuItems({ restaurantSlug: slug }),
          menuService.getRecommendedItems(slug),
        ]);
        setCategories(cats);
        setMenuItems(items);
        setRecommendedItems(recs);
      } catch (err) {
        console.error('Failed to load menu data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, [restaurantSlug, restaurant?.id, restaurant?.slug]);

  // Filter items based on active search & active category
  const filteredItems = useMemo(() => {
    let result = menuItems;

    if (selectedCategory && selectedCategory !== 'all') {
      const activeCat = categories.find((c) => c.id === selectedCategory);
      result = result.filter(
        (item) =>
          item.categoryId === selectedCategory ||
          (activeCat && item.category && item.category.toLowerCase().trim() === activeCat.name.toLowerCase().trim())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          (item.name || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [menuItems, selectedCategory, searchQuery, categories]);

  // Group items by category for "All" view
  const categorizedSections = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery.trim() !== '') {
      return null;
    }

    const groups = {};
    categories.forEach((cat) => {
      if (cat.id === 'all') return;
      const itemsForCat = menuItems.filter(
        (i) =>
          i.categoryId === cat.id ||
          (i.category && cat.name && i.category.toLowerCase().trim() === cat.name.toLowerCase().trim())
      );
      if (itemsForCat.length > 0) {
        groups[cat.id] = {
          title: cat.name,
          items: itemsForCat,
        };
      }
    });

    // Check for any remaining dishes that didn't match a category so they are NEVER hidden
    const matchedIds = new Set(Object.values(groups).flatMap((g) => g.items.map((item) => item.id)));
    const unmatchedItems = menuItems.filter((i) => !matchedIds.has(i.id));
    if (unmatchedItems.length > 0) {
      groups['other'] = {
        title: 'Specialties',
        items: unmatchedItems,
      };
    }

    // Safety fallback: If groups is empty but menuItems has items, put them all in one group!
    if (Object.keys(groups).length === 0 && menuItems.length > 0) {
      groups['all-items'] = {
        title: 'Our Menu',
        items: menuItems,
      };
    }

    return Object.keys(groups).length > 0 ? groups : null;
  }, [categories, menuItems, selectedCategory, searchQuery]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Restaurant Hero Banner */}
      <RestaurantBanner restaurant={restaurant} />

      {/* Customer and Table Welcome Pill */}
      {session && (
        <CustomerBadge
          customerName={session.customerName}
          tableNumber={session.tableNumber}
        />
      )}

      {/* Search Input */}
      <div className="sticky top-[69px] z-20 py-1 bg-warm-100/90 backdrop-blur-xs">
        <MenuSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Category Scrolling Tabs */}
      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-3 pt-2">
          <FoodCardSkeleton />
          <FoodCardSkeleton />
          <FoodCardSkeleton />
          <FoodCardSkeleton />
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={UtensilsCrossed}
          title="No Dishes Found"
          description={`We couldn't find any dishes matching "${searchQuery}". Try searching for another item or clear filters.`}
          actionLabel="View All Dishes"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      ) : (
        /* Content rendering */
        <div className="space-y-6 pt-1">
          {/* Recommended Section (shown on 'all' view when not searching) */}
          {selectedCategory === 'all' && !searchQuery.trim() && recommendedItems.length > 0 && (
            <MenuSection
              categoryTitle="⭐ Chef's Recommendations"
              items={recommendedItems}
              onOpenDetails={setCustomizingItem}
            />
          )}

          {/* If viewing All without search, show by category sections */}
          {categorizedSections ? (
            Object.entries(categorizedSections).map(([catId, data]) => (
              <MenuSection
                key={catId}
                categoryTitle={data.title}
                items={data.items}
                onOpenDetails={setCustomizingItem}
              />
            ))
          ) : (
            /* Filtered or Searched Flat List */
            <MenuSection
              categoryTitle={
                selectedCategory !== 'all'
                  ? categories.find((c) => c.id === selectedCategory)?.name || 'Menu'
                  : `Search Results (${filteredItems.length})`
              }
              items={filteredItems}
              onOpenDetails={setCustomizingItem}
            />
          )}
        </div>
      )}

      {/* Food Customization Bottom Sheet / Modal */}
      <FoodDetailsSheet
        isOpen={Boolean(customizingItem)}
        onClose={() => setCustomizingItem(null)}
        item={customizingItem}
      />
    </div>
  );
};
