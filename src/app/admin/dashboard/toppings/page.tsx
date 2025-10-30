'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '../../../../types';

interface Topping {
  id: string;
  name: string;
  price: number;
  emoji: string;
  available: boolean;
  createdAt: string;
}

interface ToppingModalProps {
  topping?: Topping | null;
  onSave: (topping: Topping) => void;
  onClose: () => void;
}

function ToppingModal({ topping, onSave, onClose }: ToppingModalProps) {
  const [formData, setFormData] = useState({
    name: topping?.name || '',
    price: topping?.price || 0,
    emoji: topping?.emoji || '',
    available: topping?.available ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseToppingData = {
      name: formData.name,
      price: formData.price,
      emoji: formData.emoji,
      available: formData.available
    };

    if (topping) {
      // Editing existing topping
      const toppingData: Topping = {
        ...baseToppingData,
        id: topping.id,
        createdAt: topping.createdAt
      };
      onSave(toppingData);
    } else {
      // Adding new topping
      const toppingData: Omit<Topping, 'id' | 'createdAt'> = baseToppingData;
      onSave(toppingData as Topping);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {topping ? 'Edit Topping' : 'Add New Topping'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Chocolate Chips"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹)
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emoji
            </label>
            <input
              type="text"
              required
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 🍫"
              maxLength={2}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="available"
              checked={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="available" className="ml-2 text-sm text-gray-700">
              Available for selection
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
            >
              {topping ? 'Update Topping' : 'Add Topping'}
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

export default function ToppingsManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [isAddingTopping, setIsAddingTopping] = useState(false);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
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

    // Load toppings from localStorage or use default data
    const storedToppings = localStorage.getItem('adminToppings');
    if (storedToppings) {
      setToppings(JSON.parse(storedToppings));
    } else {
      // Default toppings
      const defaultToppings: Topping[] = [
        {
          id: 'gems',
          name: 'GEMS',
          price: 15,
          emoji: '💎',
          available: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'marshmallow',
          name: 'MARSHMALLOW',
          price: 12,
          emoji: '🍬',
          available: true,
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'chocochip',
          name: 'CHOCOCHIP',
          price: 18,
          emoji: '🍫',
          available: true,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'sprinkles',
          name: 'SPRINKLES',
          price: 10,
          emoji: '⭐',
          available: true,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setToppings(defaultToppings);
      localStorage.setItem('adminToppings', JSON.stringify(defaultToppings));
    }
  }, [user]);

  const saveToppings = (items: Topping[]) => {
    setToppings(items);
    localStorage.setItem('adminToppings', JSON.stringify(items));
    // Dispatch custom event to notify other components of topping changes within the same tab
    window.dispatchEvent(new CustomEvent('toppingsUpdated', {
      detail: { toppings: items }
    }));
    // Also dispatch storage event for cross-tab compatibility
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'adminToppings',
      newValue: JSON.stringify(items),
      oldValue: localStorage.getItem('adminToppings')
    }));
  };

  const handleAddTopping = (newTopping: Omit<Topping, 'id' | 'createdAt'>) => {
    const topping: Topping = {
      ...newTopping,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    const updatedToppings = [...toppings, topping];
    saveToppings(updatedToppings);
    setIsAddingTopping(false);
  };

  const handleEditTopping = (updatedTopping: Topping) => {
    const updatedToppings = toppings.map(topping =>
      topping.id === updatedTopping.id ? updatedTopping : topping
    );
    saveToppings(updatedToppings);
    setEditingTopping(null);
  };

  const handleDeleteTopping = (id: string) => {
    if (confirm('Are you sure you want to delete this topping?')) {
      const updatedToppings = toppings.filter(topping => topping.id !== id);
      saveToppings(updatedToppings);
    }
  };

  const toggleAvailability = (id: string) => {
    const updatedToppings = toppings.map(topping =>
      topping.id === id ? { ...topping, available: !topping.available } : topping
    );
    saveToppings(updatedToppings);
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
              <h1 className="text-xl font-bold text-gray-900">Toppings Management</h1>
            </div>
            <button
              onClick={() => setIsAddingTopping(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              + Add New Topping
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toppings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {toppings.map((topping) => (
            <div key={topping.id} className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${!topping.available ? 'opacity-75' : ''}`}>
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">{topping.emoji}</div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    topping.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {topping.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{topping.name}</h3>
                  <p className="text-xl font-bold text-blue-600 mb-4">₹{topping.price}</p>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => toggleAvailability(topping.id)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                        topping.available
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {topping.available ? 'Make Unavailable' : 'Make Available'}
                    </button>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingTopping(topping)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTopping(topping.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {(isAddingTopping || editingTopping) && (
          <ToppingModal
            topping={editingTopping}
            onSave={editingTopping ? handleEditTopping : handleAddTopping}
            onClose={() => {
              setIsAddingTopping(false);
              setEditingTopping(null);
            }}
          />
        )}
      </div>
    </div>
  );
}