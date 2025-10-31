'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { validatePromoCode } from '../../data/promoCodes';

export default function CartPage() {
  const { state, dispatch } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const updateQuantity = (id: string, quantity: number) => {
    console.log('Cart quantity update for', id, 'to', quantity);
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
    console.log('Cart state after update:', state);
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const applyPromoCode = () => {
    const promo = validatePromoCode(promoCode, state.items);
    if (promo) {
      // Check minimum order requirement
      if (promo.minimumOrder && state.subtotal < promo.minimumOrder) {
        setPromoError(`Minimum order of ₹${promo.minimumOrder} required`);
        return;
      }

      dispatch({ type: 'APPLY_PROMO', payload: promo });
      setPromoError('');
      setPromoCode('');
    } else {
      setPromoError('Invalid promo code or not applicable to your order');
    }
  };

  const removePromo = () => {
    dispatch({ type: 'REMOVE_PROMO' });
  };

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">Add some delicious ice cream to get started!</p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {state.items.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <span className="text-4xl">{item.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 text-sm">₹{item.price} each</p>
                    {item.customizations && (
                      <div className="text-sm text-gray-500 mt-1">
                        {item.customizations.size && <span>Size: {item.customizations.size}</span>}
                        {item.customizations.size && item.customizations.toppings && item.customizations.toppings.length > 0 && <span> • </span>}
                        {item.customizations.toppings && item.customizations.toppings.length > 0 && (
                          <span>Toppings: {item.customizations.toppings.join(', ')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end md:space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-bold text-lg md:ml-4">₹{item.price * item.quantity}</span>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 text-xl md:ml-4"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal ({state.items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
              <span>₹{state.subtotal}</span>
            </div>
            {state.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({state.appliedPromo?.code})</span>
                <span>-₹{state.discount}</span>
              </div>
            )}
          </div>

          {/* Promo Code Section */}
          {!state.appliedPromo ? (
            <div className="border-t pt-4 mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={applyPromoCode}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-red-500 text-sm mt-1">{promoError}</p>}
            </div>
          ) : (
            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                <span className="text-green-700 font-medium">{state.appliedPromo.code} applied!</span>
                <button
                  onClick={removePromo}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>Total</span>
              <span>₹{state.total}</span>
            </div>

            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              <Link href="/checkout">Proceed to Checkout</Link>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}