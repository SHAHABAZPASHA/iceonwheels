'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getAuth, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db } from '../../../utils/firebase';

interface User {
  email: string;
  name?: string;
  role?: 'owner' | 'partner' | 'manager' | 'admin';
}

export default function AdminDashboard() {
  interface FirestoreOrder {
    id: string;
    total?: number;
    items?: { quantity?: number }[];
  }
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    orders: 0,
    revenue: 0,
    itemsSold: 0,
    activeItems: 0,
  });
  const router = useRouter();

  useEffect(() => {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser && firebaseUser.email) {
      setUser({ email: firebaseUser.email, name: firebaseUser.displayName || 'Admin' });
      // Fetch today's orders from Firestore
      import('../../../utils/firestoreOrders').then(({ fetchOrders }) => {
        fetchOrders({ todayOnly: true }).then((orders: FirestoreOrder[]) => {
          const revenue = orders.reduce((sum, o) => sum + (typeof o.total === 'number' ? o.total : 0), 0);
          const itemsSold = orders.reduce((sum, o) => sum + (Array.isArray(o.items) ? o.items.reduce((s: number, i: { quantity?: number }) => s + (i.quantity || 0), 0) : 0), 0);
          setStats({
            orders: orders.length,
            revenue,
            itemsSold,
            activeItems: 0, // TODO: fetch from menu if needed
          });
        });
      });
    } else {
      setUser(null);
      router.push('/admin/login');
    }
    setIsLoading(false);
  });
  return () => unsubscribe();
}, [router]);

  const handleLogout = async () => {
  const auth = getAuth();
    await signOut(auth);
    setUser(null);
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
                <p className="text-sm text-gray-500">Welcome back, {user.name || user.email}</p>
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
                ].map((item) => (
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
              {/* Admin Clear Data Button */}
              {user && user.role === 'admin' && (
                <button
                  className="mb-6 px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all orders? This cannot be undone.')) {
                      import('../../../utils/firestoreOrders').then(({ clearOrders }) => {
                        clearOrders().then(() => {
                          alert('All orders cleared!');
                          // Optionally refresh stats
                          setStats(s => ({ ...s, orders: 0, revenue: 0, itemsSold: 0 }));
                        }).catch((err) => {
                          alert('Failed to clear orders.');
                          console.error('Clear orders error:', err);
                        });
                      });
                    }
                  }}
                >
                  🗑️ Clear All Orders
                </button>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">📦</div>
                    <div>
                      <p className="text-blue-100">Today's Orders</p>
                      <p className="text-2xl font-bold">{stats.orders}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">💰</div>
                    <div>
                      <p className="text-green-100">Today's Revenue</p>
                      <p className="text-2xl font-bold">₹{stats.revenue}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">🍦</div>
                    <div>
                      <p className="text-purple-100">Items Sold</p>
                      <p className="text-2xl font-bold">{stats.itemsSold}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">⭐</div>
                    <div>
                      <p className="text-orange-100">Active Items</p>
                      <p className="text-2xl font-bold">{stats.activeItems}</p>
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
                    if (user && user.role === 'admin') return true;
                    return user && user.role && action.roles.includes(user.role);
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