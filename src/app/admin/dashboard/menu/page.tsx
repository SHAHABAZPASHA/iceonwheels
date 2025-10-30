'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { iceCreamMenu } from '../../../../data/menu';
import { IceCreamItem } from '../../../../types';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'owner' | 'partner' | 'manager' | 'admin';
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  customizations?: string[];
  popularity: number; // Number of times ordered
  createdAt: string;
}

export default function MenuManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
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

    // Load menu items from localStorage or use default data
    const storedMenu = localStorage.getItem('adminMenuItems');
    if (storedMenu) {
      const parsedStoredMenu = JSON.parse(storedMenu);
      // Ensure all items from the main menu are included
      const storedIds = parsedStoredMenu.map((item: MenuItem) => item.id);
      const missingItems = iceCreamMenu.filter(item => !storedIds.includes(item.id));

      if (missingItems.length > 0) {
        // Convert missing items to admin format and add them
        const convertedMissingItems: MenuItem[] = missingItems.map((item: IceCreamItem) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image || '/placeholder-food.jpg',
          available: true,
          customizations: ['Chocolate Sauce', 'Sprinkles', 'Nuts'], // Default customizations
          popularity: Math.floor(Math.random() * 100) + 1, // Random popularity for demo
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));

        const updatedMenu = [...parsedStoredMenu, ...convertedMissingItems].map((item: MenuItem) => {
          // Always use admin image if present and non-blank, else fallback to static image or placeholder
          const match = iceCreamMenu.find((m) => m.id === item.id);
          return {
            ...item,
            image:
              item.image && item.image.trim() !== ''
                ? item.image
                : (match && match.image) ? match.image : '/placeholder-food.jpg'
          };
        });
        setMenuItems(updatedMenu);
        localStorage.setItem('adminMenuItems', JSON.stringify(updatedMenu));
      } else {
        // Patch images for items that match iceCreamMenu
        const patchedMenu = parsedStoredMenu.map((item: MenuItem) => {
          const match = iceCreamMenu.find((m) => m.id === item.id);
          return {
            ...item,
            image:
              item.image && item.image.trim() !== ''
                ? item.image
                : (match && match.image) ? match.image : '/placeholder-food.jpg'
          };
        });
        setMenuItems(patchedMenu);
        localStorage.setItem('adminMenuItems', JSON.stringify(patchedMenu));
      }
    } else {
      // Import all items from main menu and convert to admin format
      const convertedItems: MenuItem[] = iceCreamMenu.map((item: IceCreamItem) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image || '',
        available: true,
        customizations: ['Chocolate Sauce', 'Sprinkles', 'Nuts'], // Default customizations
        popularity: Math.floor(Math.random() * 100) + 1, // Random popularity for demo
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
      setMenuItems(convertedItems);
      localStorage.setItem('adminMenuItems', JSON.stringify(convertedItems));
    }
  }, [user]);

  const saveMenuItems = (items: MenuItem[]) => {
    setMenuItems(items);
    localStorage.setItem('adminMenuItems', JSON.stringify(items));
    // Dispatch custom event to notify other components of menu changes within the same tab
    window.dispatchEvent(new CustomEvent('menuItemsUpdated', {
      detail: { items }
    }));
    // Also dispatch storage event for cross-tab compatibility
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'adminMenuItems',
      newValue: JSON.stringify(items),
      oldValue: localStorage.getItem('adminMenuItems')
    }));
  };

  const handleAddItem = (newItem: Omit<MenuItem, 'id'>) => {
    if (!user || user.role !== 'admin') {
      alert('Only admin can add menu items.');
      return;
    }
    // Prevent duplicate by name and category
    const duplicate = menuItems.find(
      i => i.name.trim().toLowerCase() === newItem.name.trim().toLowerCase() &&
           i.category.trim().toLowerCase() === newItem.category.trim().toLowerCase()
    );
    if (duplicate) {
      alert('A menu item with this name and category already exists.');
      return;
    }
    const item: MenuItem = {
      ...newItem,
      id: Date.now().toString()
    };
    const updatedItems = [...menuItems, item];
    saveMenuItems(updatedItems);
    setIsAddingItem(false);
  };

  const handleEditItem = (updatedItem: MenuItem) => {
    if (!user || user.role !== 'admin') {
      alert('Only admin can edit menu items.');
      return;
    }
    const updatedItems = menuItems.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );
    saveMenuItems(updatedItems);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (!user || user.role !== 'admin') {
      alert('Only admin can delete menu items.');
      return;
    }
    if (confirm('Are you sure you want to delete this menu item?')) {
      const updatedItems = menuItems.filter(item => item.id !== id);
      saveMenuItems(updatedItems);
    }
  };

  const toggleAvailability = (id: string) => {
    const updatedItems = menuItems.map(item =>
      item.id === id ? { ...item, available: !item.available } : item
    );
    saveMenuItems(updatedItems);
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
              <h1 className="text-xl font-bold text-gray-900">Menu Management</h1>
            </div>
            <button
              onClick={() => setIsAddingItem(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              + Add New Item
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-fadeInUp">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Items
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {Array.from(new Set(menuItems.map(item => item.category))).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Items</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {menuItems.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    item.description.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
                const matchesAvailability = availabilityFilter === 'all' ||
                                          (availabilityFilter === 'available' && item.available) ||
                                          (availabilityFilter === 'unavailable' && !item.available);
                return matchesSearch && matchesCategory && matchesAvailability;
              }).length} of {menuItems.length} items
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const confirmBulk = confirm('Are you sure you want to make all filtered items available?');
                  if (confirmBulk) {
                    const filteredItems = menuItems.filter(item => {
                      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
                      const matchesAvailability = availabilityFilter === 'all' ||
                                                (availabilityFilter === 'available' && item.available) ||
                                                (availabilityFilter === 'unavailable' && !item.available);
                      return matchesSearch && matchesCategory && matchesAvailability;
                    });
                    const updatedItems = menuItems.map(item =>
                      filteredItems.find(f => f.id === item.id) ? { ...item, available: true } : item
                    );
                    saveMenuItems(updatedItems);
                  }
                }}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors duration-200"
              >
                Bulk Available
              </button>
              <button
                onClick={() => {
                  const confirmBulk = confirm('Are you sure you want to make all filtered items unavailable?');
                  if (confirmBulk) {
                    const filteredItems = menuItems.filter(item => {
                      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
                      const matchesAvailability = availabilityFilter === 'all' ||
                                                (availabilityFilter === 'available' && item.available) ||
                                                (availabilityFilter === 'unavailable' && !item.available);
                      return matchesSearch && matchesCategory && matchesAvailability;
                    });
                    const updatedItems = menuItems.map(item =>
                      filteredItems.find(f => f.id === item.id) ? { ...item, available: false } : item
                    );
                    saveMenuItems(updatedItems);
                  }
                }}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors duration-200"
              >
                Bulk Unavailable
              </button>
            </div>
          </div>
        </div>
        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems
            .filter(item => {
              const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.description.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
              const matchesAvailability = availabilityFilter === 'all' ||
                                        (availabilityFilter === 'available' && item.available) ||
                                        (availabilityFilter === 'unavailable' && !item.available);
              return matchesSearch && matchesCategory && matchesAvailability;
            })
            .sort((a, b) => b.popularity - a.popularity)
            .map((item) => (
            <div key={item.id} className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${!item.available ? 'opacity-75' : ''}`}>
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-food.jpg';
                  }}
                />
                <div className="absolute top-2 left-2 flex space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.available
                      ? 'bg-green-100 text-green-800 animate-pulse'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.available ? 'Available' : 'Unavailable'}
                  </span>
                  {item.popularity > 40 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-bounce">
                      🔥 Popular
                    </span>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.popularity} sold
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className="text-lg font-bold text-blue-600">₹{item.price}</span>
                </div>

                <p className="text-gray-600 text-sm mb-3">{item.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {item.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">⭐</span>
                    <span className="text-xs font-medium text-gray-700">{item.popularity}</span>
                  </div>
                </div>

                {item.customizations && item.customizations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Customizations:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.customizations.map((custom, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800"
                        >
                          {custom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                      item.available
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {item.available ? 'Make Unavailable' : 'Make Available'}
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {(isAddingItem || editingItem) && (
          <MenuItemModal
            item={editingItem}
            onSave={(item) => {
              if (editingItem) {
                // Editing existing item
                handleEditItem(item as MenuItem);
              } else {
                // Adding new item
                handleAddItem(item as Omit<MenuItem, 'id'>);
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

interface MenuItemModalProps {
  item?: MenuItem | null;
  onSave: (item: MenuItem | Omit<MenuItem, 'id' | 'popularity' | 'createdAt'>) => void;
  onClose: () => void;
}

function MenuItemModal({ item, onSave, onClose }: MenuItemModalProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || 'Ice Cream',
    image: item?.image || '',
    available: item?.available ?? true,
    customizations: item?.customizations?.join(', ') || ''
  });
  const [imagePreview, setImagePreview] = useState<string>(item?.image || '');
  const [isUploading, setIsUploading] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Please select a file under 5MB.');
        return;
      }
      setIsUploading(true);
      // Upload to Cloudinary
      const formDataCloudinary = new FormData();
      formDataCloudinary.append('file', file);
      formDataCloudinary.append('upload_preset', 'iceonwheels_unsigned');
      try {
        const response = await fetch('https://api.cloudinary.com/v1_1/dzwjcdxsx/image/upload', {
          method: 'POST',
          body: formDataCloudinary,
        });
        const data = await response.json();
        if (data.secure_url) {
          setImagePreview(data.secure_url);
          setFormData({ ...formData, image: data.secure_url });
        } else {
          alert('Image upload failed: ' + (data.error?.message || 'Unknown error.'));
        }
      } catch (err) {
        alert('Image upload error. Please check your connection or try a different image.');
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const customizations = formData.customizations
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const menuItem = {
      ...formData,
      customizations,
      ...(item && { id: item.id, popularity: item.popularity, createdAt: item.createdAt })
    };

    onSave(menuItem);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {item ? 'Edit Menu Item' : 'Add New Menu Item'}
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  if (e.target.value === 'add-new-category') {
                    setShowNewCategoryInput(true);
                    setFormData({ ...formData, category: '' });
                  } else {
                    setShowNewCategoryInput(false);
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ice Cream">Ice Cream</option>
                <option value="Milkshakes">Milkshakes</option>
                <option value="Fruit Juice">Fruit Juice</option>
                <option value="Hot Chocolate Bowl">Hot Chocolate Bowl</option>
                <option value="Brownies">Brownies</option>
                <option value="Potato Twister">Potato Twister</option>
                <option value="Special Items">Special Items</option>
                <option value="French Fries">French Fries</option>
                <option value="Burger">Burger</option>
                <option value="add-new-category">➕ Add New Category</option>
              </select>
              {showNewCategoryInput && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter new category name"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      setFormData({ ...formData, category: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setFormData({ ...formData, image: '' });
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors duration-200"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <span className="mr-2">📷</span>
                  )}
                  {isUploading ? 'Uploading...' : 'Choose Image'}
                </label>
                <span className="text-sm text-gray-500">PNG, JPG up to 5MB</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customizations (comma-separated)
            </label>
            <input
              type="text"
              value={formData.customizations}
              onChange={(e) => setFormData({ ...formData, customizations: e.target.value })}
              placeholder="Chocolate Sauce, Sprinkles, Nuts"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Available for ordering
            </label>
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