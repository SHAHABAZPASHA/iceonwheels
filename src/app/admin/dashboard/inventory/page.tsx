'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'owner' | 'partner' | 'manager' | 'admin';
  name: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: 'base' | 'flavor' | 'topping' | 'packaging' | 'equipment';
  currentStock: number;
  minimumStock: number;
  unit: string;
  supplier: string;
  lastRestocked: string;
  costPerUnit: number;
  location: string;
  expiryDate?: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired';
}

interface InventoryModalProps {
  item?: InventoryItem | null;
  onSave: (item: InventoryItem | Omit<InventoryItem, 'id' | 'status' | 'lastRestocked'>) => void;
  onClose: () => void;
}

export default function InventoryManagement() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
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
  }, [isLoading, user]);

  useEffect(() => {
    if (!user) return;

    // Load inventory from localStorage or use default data
    const storedInventory = localStorage.getItem('adminInventory');
    if (storedInventory) {
      setInventory(JSON.parse(storedInventory));
    } else {
      // Default inventory items
      const defaultInventory: InventoryItem[] = [
        {
          id: '1',
          name: 'Vanilla Ice Cream Base',
          category: 'base',
          currentStock: 25,
          minimumStock: 10,
          unit: 'liters',
          supplier: 'Dairy Best Ltd',
          lastRestocked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          costPerUnit: 120,
          location: 'Cold Storage A',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'in-stock'
        },
        {
          id: '2',
          name: 'Chocolate Flavor',
          category: 'flavor',
          currentStock: 8,
          minimumStock: 15,
          unit: 'bottles',
          supplier: 'Flavor Masters',
          lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          costPerUnit: 85,
          location: 'Refrigerator B',
          expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'low-stock'
        },
        {
          id: '3',
          name: 'Waffle Cones',
          category: 'packaging',
          currentStock: 200,
          minimumStock: 50,
          unit: 'pieces',
          supplier: 'Bake Fresh',
          lastRestocked: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          costPerUnit: 2.5,
          location: 'Dry Storage C',
          status: 'in-stock'
        },
        {
          id: '4',
          name: 'Sprinkles Mix',
          category: 'topping',
          currentStock: 3,
          minimumStock: 5,
          unit: 'kg',
          supplier: 'Sweet Toppings Inc',
          lastRestocked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          costPerUnit: 150,
          location: 'Pantry D',
          expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'low-stock'
        },
        {
          id: '5',
          name: 'Ice Cream Scooper',
          category: 'equipment',
          currentStock: 1,
          minimumStock: 1,
          unit: 'pieces',
          supplier: 'Kitchen Essentials',
          lastRestocked: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          costPerUnit: 250,
          location: 'Equipment Shelf',
          status: 'in-stock'
        }
      ];
      setInventory(defaultInventory);
      localStorage.setItem('adminInventory', JSON.stringify(defaultInventory));
    }
  }, [user]);

  const saveInventory = (updatedInventory: InventoryItem[]) => {
    setInventory(updatedInventory);
    localStorage.setItem('adminInventory', JSON.stringify(updatedInventory));
  };

  const getItemStatus = (currentStock: number, minimumStock: number, expiryDate?: string): InventoryItem['status'] => {
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return 'expired';
    }
    if (currentStock === 0) {
      return 'out-of-stock';
    }
    if (currentStock <= minimumStock) {
      return 'low-stock';
    }
    return 'in-stock';
  };

  const handleAddItem = useCallback((item: Omit<InventoryItem, 'id' | 'status' | 'lastRestocked'>) => {
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const status = getItemStatus(item.currentStock, item.minimumStock, item.expiryDate);
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
      status,
      lastRestocked: new Date().toISOString()
    };
    const updatedInventory = [...inventory, newItem];
    saveInventory(updatedInventory);
    setIsAddingItem(false);
  }, [inventory]);

  const handleEditItem = useCallback((item: InventoryItem) => {
    const status = getItemStatus(item.currentStock, item.minimumStock, item.expiryDate);
    const itemWithStatus = { ...item, status };
    const updatedInventory = inventory.map(invItem =>
      invItem.id === item.id ? itemWithStatus : invItem
    );
    saveInventory(updatedInventory);
    setEditingItem(null);
  }, [inventory]);

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      const updatedInventory = inventory.filter(item => item.id !== id);
      saveInventory(updatedInventory);
    }
  };

  const updateStock = (id: string, newStock: number) => {
    const updatedInventory = inventory.map(item => {
      if (item.id === id) {
        const status = getItemStatus(newStock, item.minimumStock, item.expiryDate);
        return {
          ...item,
          currentStock: newStock,
          status,
          lastRestocked: new Date().toISOString()
        };
      }
      return item;
    });
    saveInventory(updatedInventory);
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'low-stock') return item.status === 'low-stock' || item.status === 'out-of-stock';
    return item.status === filter;
  });

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: InventoryItem['category']) => {
    switch (category) {
      case 'base': return 'bg-blue-100 text-blue-800';
      case 'flavor': return 'bg-purple-100 text-purple-800';
      case 'topping': return 'bg-pink-100 text-pink-800';
      case 'packaging': return 'bg-orange-100 text-orange-800';
      case 'equipment': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
              <h1 className="text-xl font-bold text-gray-900">Inventory Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Items</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="expired">Expired</option>
              </select>
              <button
                onClick={() => setIsAddingItem(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                + Add Item
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Inventory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📦</div>
              <div>
                <p className="text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="text-3xl mr-4 text-green-600">✅</div>
              <div>
                <p className="text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-green-600">
                  {inventory.filter(item => item.status === 'in-stock').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="text-3xl mr-4 text-yellow-600">⚠️</div>
              <div>
                <p className="text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {inventory.filter(item => item.status === 'low-stock').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="text-3xl mr-4 text-red-600">❌</div>
              <div>
                <p className="text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {inventory.filter(item => item.status === 'out-of-stock' || item.status === 'expired').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Restocked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.location}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {item.currentStock} / {item.minimumStock} {item.unit}
                        </span>
                        <button
                          onClick={() => {
                            const newStock = prompt('Enter new stock quantity:', item.currentStock.toString());
                            if (newStock !== null) {
                              const stock = parseInt(newStock);
                              if (!isNaN(stock) && stock >= 0) {
                                updateStock(item.id, stock);
                              }
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.lastRestocked).toLocaleDateString()}
                      {item.expiryDate && (
                        <div className="text-xs text-red-600">
                          Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'Start by adding your first inventory item.' : `No items with status "${filter}".`}
            </p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(isAddingItem || editingItem) && (
          <InventoryModal
            item={editingItem}
            onSave={(item) => {
              if (editingItem) {
                // Editing
                handleEditItem(item as InventoryItem);
              } else {
                // Adding
                handleAddItem(item as Omit<InventoryItem, 'id' | 'status' | 'lastRestocked'>);
              }
            }}
            onClose={() => {
              setIsAddingItem(false);
              setEditingItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function InventoryModal({ item, onSave, onClose }: InventoryModalProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || 'base',
    currentStock: item?.currentStock || 0,
    minimumStock: item?.minimumStock || 0,
    unit: item?.unit || '',
    supplier: item?.supplier || '',
    costPerUnit: item?.costPerUnit || 0,
    location: item?.location || '',
    expiryDate: item?.expiryDate || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (item) {
      // Editing existing item
      const updatedItem: InventoryItem = {
        ...item,
        ...formData
      };
      onSave(updatedItem);
    } else {
      // Adding new item
      const newItem: Omit<InventoryItem, 'id' | 'status' | 'lastRestocked'> = {
        ...formData
      };
      onSave(newItem);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
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
              Item Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryItem['category'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="base">Base</option>
                <option value="flavor">Flavor</option>
                <option value="topping">Topping</option>
                <option value="packaging">Packaging</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="kg, liters, pieces"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost per Unit (₹)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                required
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cold Storage A, Refrigerator B, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date (optional)
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
            >
              {item ? 'Update Item' : 'Add Item'}
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