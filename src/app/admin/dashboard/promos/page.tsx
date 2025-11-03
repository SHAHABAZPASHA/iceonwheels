'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { iceCreamMenu } from '../../../../data/menu';
import { AdminPromoCode, User } from '../../../../types';
import {
  fetchPromoCodes,
  addPromoCode,
  updatePromoCode,
  deletePromoCode
} from '../../../../utils/firestorePromos';

export default function PromoCodesManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([]);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [editingPromo, setEditingPromo] = useState<AdminPromoCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
      }
    } else {
      router.push('/admin/login');
    }
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    if (!isLoading && user === null) {
      router.push('/admin/login');
      return;
    }

    if (!isLoading && user) {
      // Check permissions
      if (user.role !== 'owner' && user.role !== 'partner' && user.role !== 'admin') {
        router.push('/admin/dashboard');
        return;
      }
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
    if (!user || user.role !== 'admin') {
      alert('Only admin can create promo codes.');
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

  const handleAddPromo = (newPromo: Omit<AdminPromoCode, 'id' | 'usedCount'>) => {
    if (!user || user.role !== 'admin') {
      alert('Only admin can create promo codes.');
      return;
    }
    const promo: AdminPromoCode = {
      ...newPromo,
      id: Date.now().toString(),
      usedCount: 0
    };
    const updatedPromos = [...promoCodes, promo];
    savePromoCodes(updatedPromos);
    setIsAddingPromo(false);
  };

  const handleEditPromo = (updatedPromo: AdminPromoCode) => {
    if (!user || user.role !== 'admin') {
      alert('Only admin can edit promo codes.');
      return;
    }
    const updatedPromos = promoCodes.map(promo =>
      promo.id === updatedPromo.id ? updatedPromo : promo
    );
    savePromoCodes(updatedPromos);
    setEditingPromo(null);
  };

  const handleDeletePromo = (id: string) => {
    if (!user || user.role !== 'admin') {
      alert('Only admin can delete promo codes.');
      return;
    }
    if (confirm('Are you sure you want to delete this promo code?')) {
      const updatedPromos = promoCodes.filter(promo => promo.id !== id);
      savePromoCodes(updatedPromos);
    }
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
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Promo Codes Management</h1>
            </div>
            <button
              onClick={() => setIsAddingPromo(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              + Create Promo Code
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Promo Codes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promoCodes.map((promo) => (
            <div key={promo.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{promo.code}</h3>
                    <p className="text-sm text-gray-600">{promo.description}</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => togglePromoStatus(promo.id)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        promo.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {promo.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="font-medium text-blue-600">
                      {promo.discountType === 'percentage'
                        ? `${promo.discountValue}%`
                        : `₹${promo.discountValue}`
                      }
                      {promo.maximumDiscount && promo.discountType === 'percentage' &&
                        ` (max ₹${promo.maximumDiscount})`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Order:</span>
                    <span>₹{promo.minimumOrder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage:</span>
                    <span>
                      {promo.usedCount}
                      {promo.usageLimit && ` / ${promo.usageLimit}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Until:</span>
                    <span>{new Date(promo.validUntil).toLocaleDateString()}</span>
                  </div>
                  {promo.applicableItems && promo.applicableItems.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-500">Applicable Items:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {promo.applicableItems.slice(0, 3).map((itemId: string) => {
                          const item = iceCreamMenu.find(i => i.id === itemId);
                          return item ? (
                            <span key={itemId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {item.emoji} {item.name}
                            </span>
                          ) : null;
                        })}
                        {promo.applicableItems.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            +{promo.applicableItems.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {promo.usageLimit && promo.usedCount >= promo.usageLimit
                      ? 'Usage limit reached'
                      : new Date(promo.validUntil) < new Date()
                        ? 'Expired'
                        : 'Valid'
                    }
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingPromo(promo)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePromo(promo.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {promoCodes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No promo codes yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first promo code to offer discounts to customers.
            </p>
            <button
              onClick={() => setIsAddingPromo(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Create First Promo Code
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(isAddingPromo || editingPromo) && (
          <PromoModal
            promo={editingPromo}
            onSave={editingPromo ? handleEditPromo : handleAddPromo}
            onClose={() => {
              setIsAddingPromo(false);
              setEditingPromo(null);
            }}
            onGenerateCode={generateRandomCode}
          />
        )}
      </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promo Code
              </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order (₹)
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Discount (₹)
                </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Limit
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until
              </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Applicable Items <span className="text-gray-500 text-xs">(optional - leave empty for all items)</span>
            </label>
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
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple items. Leave empty to apply to all items.
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-700">
              Active (available for use)
            </label>
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