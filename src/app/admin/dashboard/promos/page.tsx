

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchPromoCodes,
  addPromoCode,
  updatePromoCode,
  deletePromoCode
} from '../../../../utils/firestorePromos';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { AdminPromoCode } from '../../../../types';
import { iceCreamMenu } from '../../../../data/menu';

export default function PromosPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([]);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [editingPromo, setEditingPromo] = useState<AdminPromoCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
        router.push('/admin/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isLoading && user === null) {
      router.push('/admin/login');
      return;
    }

  if (!isLoading && user) {
    // Check permissions
    // Remove role check, allow any authenticated user
  }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    // Load promo codes from Firestore
    fetchPromoCodes().then(setPromoCodes);
  }, [user]);


  // Firestore-based save handlers
  const savePromoCodes = async (updatedPromos: AdminPromoCode[]) => {
    // For each promo, update or add in Firestore
    for (const promo of updatedPromos) {
      if (promo.id) {
        await updatePromoCode(promo.id, promo);
      } else {
        await addPromoCode(promo);
      }
    }
    const codes = await fetchPromoCodes();
    setPromoCodes(codes);
  };

  const handleAddPromo = async (newPromo: Omit<AdminPromoCode, 'id' | 'usedCount'>) => {
    if (!user) {
      alert('You must be logged in to create promo codes.');
      return;
    }
    await addPromoCode({ ...newPromo, usedCount: 0 });
    const codes = await fetchPromoCodes();
    setPromoCodes(codes);
  };

  const handleEditPromo = async (id: string, promo: Partial<AdminPromoCode>) => {
    await updatePromoCode(id, promo);
    const codes = await fetchPromoCodes();
    setPromoCodes(codes);
  };

  const handleDeletePromo = async (id: string) => {
    await deletePromoCode(id);
    const codes = await fetchPromoCodes();
    setPromoCodes(codes);
  };


  const togglePromoStatus = (id: string) => {
    const updatedPromos = promoCodes.map(promo =>
      promo.id === id ? { ...promo, active: !promo.active } : promo
    );
    savePromoCodes(updatedPromos);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => setIsAddingPromo(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Create First Promo Code
            </button>
          </div>
        </div>
        {/* Add/Edit Modal */}
        {(isAddingPromo || editingPromo) && (
          <PromoModal
            promo={editingPromo}
            onSave={async (promo: AdminPromoCode) => {
              if (editingPromo) {
                // Editing: pass id and partial promo
                await handleEditPromo(promo.id, promo);
                setEditingPromo(null);
              } else {
                // Adding: pass Omit<AdminPromoCode, 'id' | 'usedCount'>
                const { id, usedCount, ...newPromo } = promo;
                await handleAddPromo(newPromo);
                setIsAddingPromo(false);
              }
            }}
            onClose={() => {
              setIsAddingPromo(false);
              setEditingPromo(null);
            }}
            onGenerateCode={generateRandomCode}
          />
        )}
      </header>
    </div>
  );
}




interface PromoModalProps {
  promo?: AdminPromoCode | null;
  onSave: (promo: AdminPromoCode) => void;
  onClose: () => void;
  onGenerateCode: () => string;
}

function PromoModal({ promo, onSave, onClose, onGenerateCode }: PromoModalProps) {
  const [formData, setFormData] = useState({
    code: promo?.code || '',
    description: promo?.description || '',
    discountType: promo?.discountType || 'percentage',
    discountValue: promo?.discountValue || 0,
    minimumOrder: promo?.minimumOrder || 0,
    maximumDiscount: promo?.maximumDiscount || '',
    usageLimit: promo?.usageLimit || '',
    validFrom: promo?.validFrom || new Date().toISOString().split('T')[0],
    validUntil: promo?.validUntil || '',
    active: promo?.active ?? true,
    applicableItems: promo?.applicableItems || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const basePromoData = {
      code: formData.code,
      description: formData.description,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      minimumOrder: formData.minimumOrder,
      maximumDiscount: formData.maximumDiscount ? parseInt(formData.maximumDiscount.toString()) : undefined,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit.toString()) : undefined,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      active: formData.active,
      applicableItems: formData.applicableItems
    };

    if (promo) {
      // Editing existing promo
      const promoData: AdminPromoCode = {
        ...basePromoData,
        id: promo.id,
        usedCount: promo.usedCount
      };
      onSave(promoData);
    } else {
      // Adding new promo
      const promoData: Omit<AdminPromoCode, 'id' | 'usedCount'> = basePromoData;
      onSave(promoData as AdminPromoCode);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {promo ? 'Edit Promo Code' : 'Create New Promo Code'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="WELCOME10"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, code: onGenerateCode() })}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10% off on your first order"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input
                type="number"
                required
                min="0"
                max={formData.discountType === 'percentage' ? 100 : undefined}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={formData.discountType === 'percentage' ? '10' : '50'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.minimumOrder}
                onChange={(e) => setFormData({ ...formData, minimumOrder: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {formData.discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maximumDiscount}
                  onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
              <input
                type="number"
                min="0"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input
                type="date"
                required
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Applicable Items <span className="text-gray-500 text-xs">(optional - leave empty for all items)</span></label>
            <select
              multiple
              value={formData.applicableItems}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, applicableItems: selectedOptions });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={6}
            >
              <option value="">-- All Items (leave empty) --</option>
              {iceCreamMenu.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.emoji} {item.name} - {item.category}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple items. Leave empty to apply to all items.</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-700">Active (available for use)</label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
            >
              {promo ? 'Update Promo' : 'Create Promo'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
