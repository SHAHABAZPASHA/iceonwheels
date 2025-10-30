import { PromoCode, CartItem, AdminPromoCode } from '../types';

export const promoCodes: PromoCode[] = [
  {
    code: 'WELCOME10',
    discount: 10,
    type: 'percentage'
  },
  {
    code: 'SAVE50',
    discount: 50,
    type: 'fixed'
  },
  {
    code: 'ICE20',
    discount: 20,
    type: 'percentage'
  },
  {
    code: 'FRESH15',
    discount: 15,
    type: 'fixed'
  }
];

export function validatePromoCode(code: string, cartItems: CartItem[] = []): PromoCode | null {
  // First check localStorage for admin-created promo codes
  if (typeof window !== 'undefined') {
    const storedPromos = localStorage.getItem('adminPromoCodes');
    if (storedPromos) {
      const adminPromos = JSON.parse(storedPromos);
      const adminPromo = adminPromos.find((promo: AdminPromoCode) =>
        promo.code.toLowerCase() === code.toLowerCase() &&
        promo.active &&
        new Date(promo.validFrom) <= new Date() &&
        new Date(promo.validUntil) >= new Date() &&
        (!promo.usageLimit || promo.usedCount < promo.usageLimit) &&
        (!promo.applicableItems || promo.applicableItems.length === 0 ||
         cartItems.some((item: CartItem) => promo.applicableItems!.includes(item.id)))
      );

      if (adminPromo) {
        return {
          code: adminPromo.code,
          discount: adminPromo.discountType === 'percentage' ? adminPromo.discountValue : adminPromo.discountValue,
          type: adminPromo.discountType,
          minimumOrder: adminPromo.minimumOrder,
          maximumDiscount: adminPromo.maximumDiscount,
          applicableItems: adminPromo.applicableItems
        };
      }
    }
  }

  // Fallback to static promo codes
  return promoCodes.find(promo => promo.code.toLowerCase() === code.toLowerCase()) || null;
}