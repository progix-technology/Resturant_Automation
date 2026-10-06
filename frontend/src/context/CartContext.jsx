import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

const CartContext = createContext(null);

const TAX_RATE = 0.05; // 5% GST

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    return storage.get(STORAGE_KEYS.CART, []);
  });

  // Sync cart items to localStorage on update
  useEffect(() => {
    storage.set(STORAGE_KEYS.CART, items);
  }, [items]);

  /**
   * Generates unique composite ID for item + customized addons
   */
  const generateCartItemId = (itemId, addons = []) => {
    const addonKey = addons
      .map((a) => a.id)
      .sort()
      .join('-');
    return addonKey ? `${itemId}__${addonKey}` : itemId;
  };

  /**
   * Adds item to cart or increments quantity if already identical
   */
  const addItem = (foodItem, quantity = 1, selectedAddons = [], specialInstructions = '') => {
    const cartItemId = generateCartItemId(foodItem.id, selectedAddons);
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0);
    const unitPrice = foodItem.price + addonsTotal;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          itemTotal: newQty * existing.unitPrice,
          specialInstructions: specialInstructions || existing.specialInstructions,
        };
        return updated;
      }

      const newItem = {
        cartItemId,
        id: foodItem.id,
        name: foodItem.name,
        price: foodItem.price,
        image: foodItem.image,
        isVeg: foodItem.isVeg,
        quantity,
        selectedAddons,
        unitPrice,
        itemTotal: unitPrice * quantity,
        specialInstructions,
      };
      return [...prevItems, newItem];
    });
  };

  /**
   * Updates quantity of specific cart entry
   */
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: item.unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  };

  /**
   * Removes specific item from cart
   */
  const removeItem = (cartItemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
  };

  /**
   * Empties cart
   */
  const clearCart = () => {
    setItems([]);
  };

  /**
   * Computes total quantity of a base food item in cart (across any addon permutations)
   */
  const getItemCartQuantity = (foodId) => {
    return items
      .filter((item) => item.id === foodId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Memoized financial calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.itemTotal, 0);
  }, [items]);

  const tax = useMemo(() => {
    return Math.round(subtotal * TAX_RATE);
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  /**
   * Decrements or removes a food item from cart
   */
  const decrementItem = (foodId) => {
    setItems((prevItems) => {
      const targetIndex = [...prevItems].reverse().findIndex((item) => item.id === foodId);
      if (targetIndex === -1) return prevItems;

      const actualIndex = prevItems.length - 1 - targetIndex;
      const targetItem = prevItems[actualIndex];

      if (targetItem.quantity > 1) {
        const updated = [...prevItems];
        const newQty = targetItem.quantity - 1;
        updated[actualIndex] = {
          ...targetItem,
          quantity: newQty,
          itemTotal: newQty * targetItem.unitPrice,
        };
        return updated;
      } else {
        return prevItems.filter((_, idx) => idx !== actualIndex);
      }
    });
  };

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        tax,
        total,
        itemCount,
        addItem,
        decrementItem,
        updateQuantity,
        removeItem,
        clearCart,
        getItemCartQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
