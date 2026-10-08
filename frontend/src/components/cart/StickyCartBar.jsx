import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, HelpCircle, Utensils, Search } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useSession } from '../../hooks/useSession';
import { formatCurrency } from '../../utils/currency';
import { notificationService } from '../../services/notificationService';
import { Toast } from '../common/Toast';

export const StickyCartBar = ({ restaurantSlug, onFocusSearch }) => {
  const navigate = useNavigate();
  const { itemCount, total } = useCart();
  const { session } = useSession();
  const [showHelpToast, setShowHelpToast] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);

  const slug = restaurantSlug || session?.restaurantSlug || 'spice-garden';

  const handleViewCart = () => {
    navigate(`/menu/${slug}/cart`);
  };

  const handleMenuClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchClick = () => {
    if (onFocusSearch) {
      onFocusSearch();
    } else {
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleCallWaiter = async () => {
    const tableNum = session?.tableNumber || '01';
    const name = session?.customerName || 'Guest Diner';
    setIsCallingWaiter(true);
    try {
      await notificationService.requestWaiter({
        tableNumber: tableNum,
        customerName: name,
        restaurantSlug: slug,
      });
      setShowHelpToast(true);
    } catch (err) {
      setShowHelpToast(true);
    } finally {
      setIsCallingWaiter(false);
    }
  };

  return (
    <>
      {/* Toast feedback when calling waiter */}
      {showHelpToast && (
        <Toast
          message={`Waiter notified for Table ${session?.tableNumber || '12'}! A server will assist you shortly.`}
          type="info"
          duration={3500}
          onClose={() => setShowHelpToast(false)}
        />
      )}

      {/* Floating container fixed firmly at bottom of screen with highest z-index */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[999] p-3 sm:p-4 pointer-events-none flex flex-col items-center justify-end"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
      >
        <div className="w-full max-w-md pointer-events-auto flex flex-col gap-2.5">
          {/* Top-Right "Need Help?" floating pill */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCallWaiter}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-charcoal-800 text-xs font-bold shadow-lg border border-warm-200 hover:bg-warm-50 active:scale-95 transition-all select-none cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-brand-800" />
              <span>Need Help?</span>
            </button>
          </div>

          {/* Green Floating Cart Bar (Shows when itemCount > 0) */}
          {itemCount > 0 && (
            <button
              type="button"
              onClick={handleViewCart}
              className="w-full min-h-[52px] h-14 px-5 rounded-2xl bg-[#09392B] hover:bg-[#072F23] active:scale-[0.99] text-white flex items-center justify-between shadow-2xl transition-all duration-150 select-none cursor-pointer border border-[#0d4a38]"
              aria-label="View cart and proceed"
            >
              {/* Left: 1 item · ₹220 */}
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white tracking-tight">
                <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                <span className="opacity-75">·</span>
                <span>{formatCurrency(total)}</span>
              </div>

              {/* Right: View Cart → */}
              <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-white">
                <span>View Cart</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </button>
          )}

          {/* Floating Navigation Pill at bottom */}
          <nav
            aria-label="Quick navigation"
            className="w-full h-14 min-h-[48px] bg-white rounded-full px-3 py-1.5 border border-warm-200 shadow-2xl flex items-center justify-around text-xs font-bold text-charcoal-700"
          >
            {/* Menu Button (Active) */}
            <button
              type="button"
              onClick={handleMenuClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EAF3EE] text-[#09392B] active:scale-95 transition-all cursor-pointer"
            >
              <Utensils className="w-4 h-4 text-[#09392B]" />
              <span>Menu</span>
            </button>

            {/* Search Button */}
            <button
              type="button"
              onClick={handleSearchClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-warm-100 text-charcoal-700 active:scale-95 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 text-charcoal-500" />
              <span>Search</span>
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={handleViewCart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-warm-100 text-charcoal-700 active:scale-95 transition-all relative cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-charcoal-600" />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#09392B] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                  {itemCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};
