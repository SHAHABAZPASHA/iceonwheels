'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'owner' | 'partner' | 'manager' | 'admin';
  name: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Always require login: clear any stale user data if not valid
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Validate user object minimally
        if (parsedUser && parsedUser.username && parsedUser.role) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('adminUser');
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('adminUser');
      }
    } else {
      localStorage.removeItem('adminUser');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && user === null) {
      router.push('/admin/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
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
              <img src="/logo.jpg" alt="Ice on Wheels" className="h-10 w-10 rounded-full mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  Admin
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm mr-8">
            <nav className="p-4">
              <ul className="space-y-2">
                {[
                  { name: 'Overview', id: 'overview', icon: '📊' },
                  { name: 'Menu Management', id: 'menu', icon: '🍦', href: '/admin/dashboard/menu' },
                  { name: 'Toppings', id: 'toppings', icon: '🍨', href: '/admin/dashboard/toppings' },
                  { name: 'Orders', id: 'orders', icon: '📦', href: '/admin/dashboard/orders' },
                  { name: 'Inventory', id: 'inventory', icon: '📦', href: '/admin/dashboard/inventory' },
                  { name: 'Promo Codes', id: 'promos', icon: '🎫', href: '/admin/dashboard/promos' },
                  { name: 'Users', id: 'users', icon: '👥', href: '/admin/dashboard/users' },
                  { name: 'Posters', id: 'posters', icon: '📢', href: '/admin/dashboard/posters' },
                ].filter(item => {
                  if (user.role === 'admin') return true;
                  if (user.role === 'owner') return true;
                  if (user.role === 'partner') return ['overview', 'menu', 'orders', 'inventory', 'promos'].includes(item.id);
                  if (user.role === 'manager') return ['overview', 'orders', 'inventory'].includes(item.id);
                  return false;
                }).map((item) => (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} className="w-full flex items-center px-4 py-3 text-left rounded-md transition-colors text-gray-700 hover:bg-gray-100 block">
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </Link>
                    ) : (
                      <button className="w-full flex items-center px-4 py-3 text-left rounded-md transition-colors bg-blue-100 text-blue-700 border-r-4 border-blue-500">
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">📦</div>
                    <div>
                      <p className="text-blue-100">Today's Orders</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">💰</div>
                    <div>
                      <p className="text-green-100">Today's Revenue</p>
                      <p className="text-2xl font-bold">₹2,450</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">🍦</div>
                    <div>
                      <p className="text-purple-100">Items Sold</p>
                      <p className="text-2xl font-bold">156</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">⭐</div>
                    <div>
                      <p className="text-orange-100">Active Items</p>
                      <p className="text-2xl font-bold">42</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { href: '/admin/dashboard/toppings', icon: '🍨', text: 'Manage Toppings', roles: ['admin', 'owner', 'partner'] },
                    { href: '/admin/dashboard/orders', icon: '📦', text: 'View Orders', roles: ['admin', 'owner', 'partner', 'manager'] },
                    { href: '/admin/dashboard/promos', icon: '🎫', text: 'Create Promo', roles: ['admin', 'owner', 'partner'] },
                    { href: '/admin/dashboard/inventory', icon: '📦', text: 'Check Inventory', roles: ['admin', 'owner', 'partner', 'manager'] },
                    { href: '/admin/dashboard/users', icon: '👥', text: 'Manage Users', roles: ['admin', 'owner'] },
                    { href: '/admin/dashboard/posters', icon: '📢', text: 'Create Poster', roles: ['admin', 'owner'] },
                  ].filter(action => {
                    if (user.role === 'admin') return true;
                    return action.roles.includes(user.role);
                  }).map((action) => (
                      // Only show features allowed for the user's role
                    <Link key={action.href} href={action.href} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all text-center block">
                      <div className="text-2xl mb-2">{action.icon}</div>
                      <p className="font-medium">{action.text}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}