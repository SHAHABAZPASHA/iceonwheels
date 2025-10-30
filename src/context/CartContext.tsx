'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, PromoCode } from '../types';

interface CartState {
  items: CartItem[];
  subtotal: number;
  discount: number;
  appliedPromo: PromoCode | null;
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'APPLY_PROMO'; payload: PromoCode }
  | { type: 'REMOVE_PROMO' }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  subtotal: 0,
  discount: 0,
  appliedPromo: null,
  total: 0
};

function calculateTotals(items: CartItem[], promo: PromoCode | null): { subtotal: number; discount: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discount = 0;

  if (promo) {
    // Check minimum order requirement
    if (promo.minimumOrder && subtotal < promo.minimumOrder) {
      return { subtotal, discount: 0, total: subtotal };
    }

    if (promo.type === 'percentage') {
      discount = (subtotal * promo.discount) / 100;
      // Apply maximum discount limit if specified
      if (promo.maximumDiscount && discount > promo.maximumDiscount) {
        discount = promo.maximumDiscount;
      }
    } else {
      discount = Math.min(promo.discount, subtotal);
    }
  }

  const total = subtotal - discount;
  return { subtotal, discount, total };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      let newItems: CartItem[];

      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }

      const { subtotal, discount, total } = calculateTotals(newItems, state.appliedPromo);
      return { ...state, items: newItems, subtotal, discount, total };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const { subtotal, discount, total } = calculateTotals(newItems, state.appliedPromo);
      return { ...state, items: newItems, subtotal, discount, total };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);

      const { subtotal, discount, total } = calculateTotals(newItems, state.appliedPromo);
      return { ...state, items: newItems, subtotal, discount, total };
    }

    case 'APPLY_PROMO': {
      const { subtotal, discount, total } = calculateTotals(state.items, action.payload);
      return { ...state, appliedPromo: action.payload, discount, total };
    }

    case 'REMOVE_PROMO': {
      const { subtotal, discount, total } = calculateTotals(state.items, null);
      return { ...state, appliedPromo: null, discount, total };
    }

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}