'use client';

import { useState, useEffect } from 'react';
import { IceCreamItem, CartItem } from '../types';
import { iceCreamMenu } from '../data/menu';
import MenuItem from './MenuItem';
import CustomizationModal from './CustomizationModal';
import { useCart } from '../context/CartContext';

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<IceCreamItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [menuData, setMenuData] = useState<IceCreamItem[]>(iceCreamMenu);
  const { dispatch } = useCart();

  // Load admin-added items and merge with static menu
  useEffect(() => {
    const loadMenuData = () => {
      const adminItems = localStorage.getItem('adminMenuItems');
      if (adminItems) {
        try {
          const parsedAdminItems = JSON.parse(adminItems);
          // Convert admin MenuItem to IceCreamItem format (include all items, not just available)
          const convertedAdminItems: IceCreamItem[] = parsedAdminItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            emoji: item.image ? '' : '🍨',
            category: item.category,
            image: item.image,
            available: item.available !== undefined ? item.available : true
          }));

          // Merge with static menu data, replacing items with same ID (admin versions take priority)
          const mergedMenu = [...iceCreamMenu];
          convertedAdminItems.forEach(adminItem => {
            const existingIndex = mergedMenu.findIndex(staticItem => staticItem.id === adminItem.id);
            if (existingIndex !== -1) {
              // Always use admin image if present, else fallback to static image or placeholder
              mergedMenu[existingIndex] = {
                ...mergedMenu[existingIndex],
                ...adminItem,
                image: adminItem.image && adminItem.image.trim() !== ''
                  ? adminItem.image
                  : mergedMenu[existingIndex].image || '/placeholder-food.jpg'
              };
            } else {
              mergedMenu.push({
                ...adminItem,
                image: adminItem.image && adminItem.image.trim() !== ''
                  ? adminItem.image
                  : '/placeholder-food.jpg'
              });
            }
          });
          setMenuData(mergedMenu);
        } catch (error) {
          console.error('Error loading admin menu items:', error);
          setMenuData(iceCreamMenu);
        }
      } else {
        setMenuData(iceCreamMenu);
      }
    };

    loadMenuData();

    // Listen for storage changes to update menu when admin adds items
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminMenuItems') {
        loadMenuData();
      }
    };

    // Listen for custom menu update events (for same-tab updates)
    const handleMenuUpdate = () => {
      loadMenuData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('menuItemsUpdated', handleMenuUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('menuItemsUpdated', handleMenuUpdate);
    };
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