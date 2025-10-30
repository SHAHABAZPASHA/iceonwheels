'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'owner' | 'partner' | 'manager' | 'admin';
  name: string;
}

interface Poster {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'promotion' | 'announcement' | 'event' | 'seasonal';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  endDate: string;
  active: boolean;
  targetAudience?: string[];
  clickUrl?: string;
  createdAt: string;
}

export default function PostersManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [isAddingPoster, setIsAddingPoster] = useState(false);
  const [editingPoster, setEditingPoster] = useState<Poster | null>(null);
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
      if (user.role !== 'owner' && user.role !== 'admin') {
        router.push('/admin/dashboard');
        return;
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    // Load posters from localStorage or use default data
    const storedPosters = localStorage.getItem('adminPosters');
    if (storedPosters) {
      setPosters(JSON.parse(storedPosters));
    } else {
      // Default posters
      const defaultPosters: Poster[] = [
        {
          id: '1',
          title: 'Summer Special Ice Cream Festival',
          description: 'Beat the heat with our refreshing ice cream festival! 20% off on all summer specials.',
          imageUrl: '/festival-poster.jpg',
          type: 'event',
          priority: 'high',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          active: true,
          targetAudience: ['all'],
          clickUrl: '/menu',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'New Flavor Alert!',
          description: 'Introducing Mango Mania - Fresh mango ice cream made with real Alphonso mangoes!',
          imageUrl: '/mango-poster.jpg',
          type: 'promotion',
          priority: 'medium',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          active: true,
          targetAudience: ['ice-cream-lovers'],
          clickUrl: '/menu',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Diwali Special Celebration!',
          description: 'Celebrate Diwali with our festive ice cream collection - Saffron, Gold, and Silver scoops with traditional flavors!',
          imageUrl: '/festival-poster.jpg',
          type: 'seasonal',
          priority: 'high',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
          active: true,
          targetAudience: ['families', 'festive-celebrators'],
          clickUrl: '/menu',
          createdAt: new Date().toISOString()
        }
      ];
      setPosters(defaultPosters);
      localStorage.setItem('adminPosters', JSON.stringify(defaultPosters));
    }
  }, [user]);

  const savePosters = (updatedPosters: Poster[]) => {
    setPosters(updatedPosters);
    localStorage.setItem('adminPosters', JSON.stringify(updatedPosters));
    // Dispatch custom event to notify other components of poster changes within the same tab
    window.dispatchEvent(new CustomEvent('postersUpdated', {
      detail: { posters: updatedPosters }
    }));
    // Also dispatch storage event for cross-tab compatibility
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'adminPosters',
      newValue: JSON.stringify(updatedPosters),
      oldValue: localStorage.getItem('adminPosters')
    }));
  };

  const handleAddPoster = (newPoster: Omit<Poster, 'id' | 'createdAt'>) => {
    const poster: Poster = {
      ...newPoster,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    const updatedPosters = [...posters, poster];
    savePosters(updatedPosters);
    setIsAddingPoster(false);
  };

  const handleEditPoster = (updatedPoster: Poster) => {
    const updatedPosters = posters.map(poster =>
      poster.id === updatedPoster.id ? updatedPoster : poster
    );
    savePosters(updatedPosters);
    setEditingPoster(null);
  };

  const handleDeletePoster = (id: string) => {
    if (confirm('Are you sure you want to delete this poster?')) {
      const updatedPosters = posters.filter(poster => poster.id !== id);
      savePosters(updatedPosters);
    }
  };

  const togglePosterStatus = (id: string) => {
    const updatedPosters = posters.map(poster =>
      poster.id === id ? { ...poster, active: !poster.active } : poster
    );
    savePosters(updatedPosters);
  };

  const getTypeColor = (type: Poster['type']) => {
    switch (type) {
      case 'promotion': return 'bg-blue-100 text-blue-800';
      case 'announcement': return 'bg-green-100 text-green-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'seasonal': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Poster['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-xl font-bold text-gray-900">Posters & Announcements</h1>
            </div>
            <button
              onClick={() => setIsAddingPoster(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              + Create Poster
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Posters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posters.map((poster) => (
            <div key={poster.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
                <img
                  src={poster.imageUrl}
                  alt={poster.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-poster.jpg';
                  }}
                />
                <div className="absolute top-2 left-2 flex space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(poster.type)}`}>
                    {poster.type}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPriorityColor(poster.priority)}`}>
                    {poster.priority}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => togglePosterStatus(poster.id)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      poster.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {poster.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{poster.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{poster.description}</p>

                <div className="space-y-1 text-xs text-gray-500 mb-4">
                  <p><strong>Start:</strong> {new Date(poster.startDate).toLocaleDateString()}</p>
                  <p><strong>End:</strong> {new Date(poster.endDate).toLocaleDateString()}</p>
                  {poster.targetAudience && poster.targetAudience.length > 0 && (
                    <p><strong>Audience:</strong> {poster.targetAudience.join(', ')}</p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {new Date(poster.endDate) < new Date()
                      ? 'Expired'
                      : poster.active
                        ? 'Live'
                        : 'Inactive'
                    }
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingPoster(poster)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePoster(poster.id)}
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

        {posters.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posters yet</h3>
            <p className="text-gray-600 mb-4">
              Create promotional posters and announcements to engage your customers.
            </p>
            <button
              onClick={() => setIsAddingPoster(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Create First Poster
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(isAddingPoster || editingPoster) && (
          <PosterModal
            poster={editingPoster}
            onSave={(poster) => {
              if (editingPoster) {
                // Editing existing poster
                handleEditPoster(poster as Poster);
              } else {
                // Adding new poster
                handleAddPoster(poster as Omit<Poster, 'id' | 'createdAt'>);
              }
            }}
            onClose={() => {
              setIsAddingPoster(false);
              setEditingPoster(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

interface PosterModalProps {
  poster?: Poster | null;
  onSave: (poster: Poster | Omit<Poster, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

function PosterModal({ poster, onSave, onClose }: PosterModalProps) {
  const [formData, setFormData] = useState({
    title: poster?.title || '',
    description: poster?.description || '',
    imageUrl: poster?.imageUrl || '',
    type: poster?.type || 'promotion',
    priority: poster?.priority || 'medium',
    startDate: poster?.startDate || new Date().toISOString().split('T')[0],
    endDate: poster?.endDate || '',
    active: poster?.active ?? true,
    targetAudience: poster?.targetAudience?.join(', ') || 'all',
    clickUrl: poster?.clickUrl || ''
  });
  const [imagePreview, setImagePreview] = useState<string>(poster?.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData({ ...formData, imageUrl: result });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetAudience = formData.targetAudience
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    const posterData = {
      ...formData,
      targetAudience,
      ...(poster && { id: poster.id, createdAt: poster.createdAt })
    };

    onSave(posterData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {poster ? 'Edit Poster' : 'Create New Poster'}
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
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Summer Ice Cream Festival"
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
              placeholder="Beat the heat with our refreshing ice cream festival!"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Poster['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="promotion">Promotion</option>
                <option value="announcement">Announcement</option>
                <option value="event">Event</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Poster['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poster Image
            </label>
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setFormData({ ...formData, imageUrl: '' });
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
                  id="poster-image-upload"
                />
                <label
                  htmlFor="poster-image-upload"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors duration-200"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <span className="mr-2">📷</span>
                  )}
                  {isUploading ? 'Uploading...' : 'Choose Poster Image'}
                </label>
                <span className="text-sm text-gray-500">PNG, JPG up to 5MB</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience (comma-separated)
            </label>
            <input
              type="text"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="all, families, students"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Click URL <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.clickUrl}
              onChange={(e) => setFormData({ ...formData, clickUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="/menu or https://external-link.com"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty if no link needed</p>
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
              Active (visible to customers)
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
            >
              {poster ? 'Update Poster' : 'Create Poster'}
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