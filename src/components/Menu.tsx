"use client";
'use client';

import { useState, useEffect } from 'react';
import { IceCreamItem, CartItem } from '../types';
import { fetchMenuItems } from '../utils/firestoreMenu';
import MenuItem from './MenuItem';
import CustomizationModal from './CustomizationModal';
import { useCart } from '../context/CartContext';

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<IceCreamItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
    const [menuData, setMenuData] = useState<IceCreamItem[]>([]);
  const { dispatch } = useCart();

  // Load menu items from Firestore
  useEffect(() => {
    async function loadMenu() {
      try {
        const items = await fetchMenuItems();
        if (items && items.length > 0) {
            setMenuItems(items);
        } else {
          // Fallback to local menu data if Firestore is empty
          const localMenu = (await import('../data/menu')).iceCreamMenu;
            setMenuItems(localMenu);
          console.warn('Firestore menu empty, loaded local menu data.');
        }
      } catch (error) {
        // Fallback to local menu data if Firestore fetch fails
        const localMenu = (await import('../data/menu')).iceCreamMenu;
          setMenuItems(localMenu);
        console.error('Failed to fetch menu from Firestore:', error);
      }
    }
    let didFallback = false;
    const fetchMenu = async () => {
      try {
        const items = await fetchMenuItems();
        if (items && items.length > 0) {
          setMenuItems(items);
        } else {
          setMenuItems(localMenu);
          didFallback = true;
        }
      } catch (err) {
        setMenuItems(localMenu);
        setError("Unable to load menu from Firestore. Showing local menu.");
        didFallback = true;
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
    // If Firestore is slow or unreachable, fallback instantly after 1.5s
    const fallbackTimeout = setTimeout(() => {
      if (loading && !didFallback) {
        setMenuItems(localMenu);
        setError("Menu loaded from local data due to Firestore timeout.");
        setLoading(false);
      }
    }, 1500);
    return () => clearTimeout(fallbackTimeout);
  }, []);

  const categories = ['All', ...Array.from(new Set(menuData.map(item => item.category)))];

  const filteredMenu = selectedCategory === 'All'
    ? menuData
    : menuData.filter(item => item.category === selectedCategory);

  const handleCustomize = (item: IceCreamItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddToCart = (cartItem: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: cartItem });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }));
    // Also update cart context if item is already in cart
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 py-12 min-h-screen relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full animate-float opacity-60"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-gradient-to-br from-blue-300 to-green-400 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full animate-float opacity-50" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/3 right-10 w-5 h-5 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full animate-float opacity-70" style={{ animationDelay: '0.5s' }}></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 animate-fade-in-up relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 relative z-10">
            Our Ice Cream Menu
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto relative z-10">
            Discover our delicious frozen treats, crafted with love and the finest ingredients
          </p>
          <div className="mt-6 flex justify-center space-x-2 relative z-10">
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-1 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 animate-slide-in-left">
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg animate-bounce-in'
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md border border-gray-200'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredMenu.map((item, index) => (
            <div
              key={item.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Show unavailable items with message and disabled button */}
              <MenuItem
                item={item}
                onCustomize={item.available ? handleCustomize : undefined}
                quantity={itemQuantities[item.id] || 1}
                onQuantityChange={item.available ? (quantity) => updateQuantity(item.id, quantity) : undefined}
                unavailableMessage={!item.available ? 'Sorry, this item is currently unavailable.' : undefined}
              />
            </div>
          ))}
        </div>

        <CustomizationModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={closeModal}
          onAddToCart={handleAddToCart}
          quantity={selectedItem ? (itemQuantities[selectedItem.id] || 1) : 1}
        />
      </div>
    </div>
  );
}