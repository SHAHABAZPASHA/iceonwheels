"use client";
import { IceCreamItem } from '../types';

interface MenuItemProps {
  item: IceCreamItem;
  onCustomize?: (item: IceCreamItem) => void;
  quantity: number;
  onQuantityChange?: (quantity: number) => void;
  unavailableMessage?: string;
}

export default function MenuItem({ item, onCustomize, quantity, onQuantityChange }: MenuItemProps) {
  const { unavailableMessage } = arguments[0];
  const isAvailable = item.available !== false;
  const showUnavailable = !isAvailable;
  const increaseQuantity = () => {
    if (onQuantityChange) onQuantityChange(quantity + 1);
  };
  const decreaseQuantity = () => {
    if (onQuantityChange) onQuantityChange(quantity > 1 ? quantity - 1 : 1);
  };
  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover-lift border border-white/20 group relative overflow-hidden ${showUnavailable ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Image only, clearly visible */}
      <div className="mb-4 relative z-10 animate-float">
        <img
          src={item.image ? item.image : '/placeholder-food.jpg'}
          alt={item.name}
          className="w-full h-48 object-cover rounded-xl shadow-md border border-gray-200"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-food.jpg';
          }}
        />
      </div>

      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
          {item.name}
        </h3>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {item.description}
        </p>

        <div className="flex justify-between items-center mb-4">
          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ₹{item.price}
          </p>
          <span className="text-xs bg-gradient-to-r from-pink-100 to-purple-100 px-3 py-1 rounded-full text-gray-700 font-medium border border-purple-200">
            {item.category}
          </span>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50/80 rounded-xl backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={decreaseQuantity}
              className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-full hover:from-red-500 hover:to-pink-600 transition-all duration-300 flex items-center justify-center font-bold shadow-md hover:shadow-lg transform hover:scale-110"
              disabled={showUnavailable || !onQuantityChange}
            >
              -
            </button>
            <span className="text-xl font-bold min-w-[3rem] text-center text-gray-800">
              {quantity}
            </span>
            <button
              onClick={increaseQuantity}
              className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-full hover:from-green-500 hover:to-blue-600 transition-all duration-300 flex items-center justify-center font-bold shadow-md hover:shadow-lg transform hover:scale-110"
              disabled={showUnavailable || !onQuantityChange}
            >
              +
            </button>
          </div>
          <span className="text-sm text-gray-600 font-medium">Quantity</span>
        </div>

        <button
          onClick={isAvailable && onCustomize ? () => onCustomize(item) : undefined}
          className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold transform hover:scale-105 shadow-lg hover:shadow-xl"
          disabled={showUnavailable || !onCustomize}
        >
          {isAvailable ? 'Customize & Add to Cart' : 'Unavailable'}
        </button>
        {/* Show unavailable message if provided */}
        {showUnavailable && (
          <div className="mt-4 text-center text-red-600 font-semibold text-sm">
            {typeof unavailableMessage === 'string' ? unavailableMessage : 'Sorry, this item is currently unavailable.'}
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full opacity-60"></div>
      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-blue-400 to-green-500 rounded-full opacity-40"></div>
    </div>
  );
}