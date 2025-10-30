"use client";
'use client';

import { useState, useEffect } from 'react';
import { IceCreamItem, CartItem } from '../types';

interface CustomizationModalProps {
  item: IceCreamItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
  quantity?: number;
}

interface Topping {
  id: string;
  name: string;
  price: number;
  emoji: string;
  available: boolean;
}

const sizes = [
  { id: 'small', name: 'Small', price: 0, emoji: '🍨' },
  { id: 'medium', name: 'Medium', price: 10, emoji: '🍦' },
  { id: 'large', name: 'Large', price: 20, emoji: '🥄' }
];

export default function CustomizationModal({ item, isOpen, onClose, onAddToCart, quantity = 1 }: CustomizationModalProps) {
  const [selectedSize, setSelectedSize] = useState('medium');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);

  // Load toppings from localStorage
  useEffect(() => {
    const loadToppings = () => {
      const storedToppings = localStorage.getItem('adminToppings');
      if (storedToppings) {
        try {
          const parsedToppings = JSON.parse(storedToppings);
          // Filter only available toppings
          const availableToppings = parsedToppings.filter((topping: Topping) => topping.available);
          setToppings(availableToppings);
        } catch (error) {
          console.error('Error loading toppings:', error);
          // Fallback to default toppings if parsing fails
          setToppings([
            { id: 'gems', name: 'GEMS', price: 15, emoji: '💎', available: true },
            { id: 'marshmallow', name: 'MARSHMALLOW', price: 12, emoji: '🍬', available: true },
            { id: 'chocochip', name: 'CHOCOCHIP', price: 18, emoji: '🍫', available: true },
            { id: 'sprinkles', name: 'SPRINKLES', price: 10, emoji: '⭐', available: true }
          ]);
        }
      } else {
        // Default toppings if none stored
        setToppings([
          { id: 'gems', name: 'GEMS', price: 15, emoji: '💎', available: true },
          { id: 'marshmallow', name: 'MARSHMALLOW', price: 12, emoji: '🍬', available: true },
          { id: 'chocochip', name: 'CHOCOCHIP', price: 18, emoji: '🍫', available: true },
          { id: 'sprinkles', name: 'SPRINKLES', price: 10, emoji: '⭐', available: true }
        ]);
      }
    };

    if (isOpen) {
      loadToppings();
    }

    // Listen for storage changes and custom events to update toppings when admin makes changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminToppings') {
        loadToppings();
      }
    };

    const handleToppingsUpdate = () => {
      loadToppings();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('toppingsUpdated', handleToppingsUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('toppingsUpdated', handleToppingsUpdate);
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  // Determine what customization options to show based on category
  const isIceCream = item.category === 'Ice Cream';
  const isJuiceOrMilkshake = item.category === 'Fruit Juice' || item.category === 'Milkshakes';
  const showSizeSelection = isJuiceOrMilkshake;
  const showToppings = isIceCream;

  const toggleTopping = (toppingId: string) => {
    setSelectedToppings(prev =>
      prev.includes(toppingId)
        ? prev.filter(id => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  const calculateTotal = () => {
    let total = item.price;
    
    if (showSizeSelection) {
      const sizePrice = sizes.find(s => s.id === selectedSize)?.price || 0;
      total += sizePrice;
    }
    
    if (showToppings) {
      const toppingsPrice = selectedToppings.reduce((total, toppingId) => {
        const topping = toppings.find(t => t.id === toppingId);
        return total + (topping?.price || 0);
      }, 0);
      total += toppingsPrice;
    }
    
    return total;
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      ...item,
      quantity: quantity,
      customizations: {
        ...(showSizeSelection && { size: selectedSize as 'small' | 'medium' | 'large' }),
        ...(showToppings && { toppings: selectedToppings })
      }
    };
    onAddToCart(cartItem);
    onClose();
    // Reset selections
    setSelectedSize('medium');
    setSelectedToppings([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto animate-bounce-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Customize Your {item.emoji} {item.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Size Selection - Only for Juices and Milkshakes */}
          {showSizeSelection && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Choose Size</h3>
              <div className="space-y-2">
                {sizes.map(size => (
                  <label key={size.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="size"
                      value={size.id}
                      checked={selectedSize === size.id}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-2xl">{size.emoji}</span>
                    <span className="flex-1">{size.name}</span>
                    <span className="text-gray-600">+₹{size.price}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Toppings Selection - Only for Ice Cream */}
          {showToppings && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Add Toppings</h3>
              <div className="space-y-2">
                {toppings.map(topping => (
                  <label key={topping.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedToppings.includes(topping.id)}
                      onChange={() => toggleTopping(topping.id)}
                      className="text-blue-600"
                    />
                    <span className="text-2xl">{topping.emoji}</span>
                    <span className="flex-1">{topping.name}</span>
                    <span className="text-gray-600">+₹{topping.price}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Show message for items without customization */}
          {!showSizeSelection && !showToppings && (
            <div className="mb-6 text-center text-gray-600">
              <p>This item doesn&apos;t require customization.</p>
              <p className="text-sm mt-2">Click &quot;Add to Cart&quot; to proceed.</p>
            </div>
          )}

          {/* Total and Add to Cart */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-blue-600">₹{calculateTotal()}</span>
            </div>
            <button
              onClick={handleAddToCart}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}