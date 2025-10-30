'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'owner' | 'partner' | 'manager' | 'admin';
  name: string;
}


export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get users from localStorage
    const storedUsers = localStorage.getItem('adminUsers');
    let users: User[] = [];
    if (storedUsers) {
      try {
        users = JSON.parse(storedUsers);
      } catch {
        users = [];
      }
    }
    // Always set Irfan as admin before checking credentials
    users = users.map(u =>
      u.username === 'irfan' ? { ...u, role: 'admin' as 'admin' } : u
    );
    if (!users.some((u: User) => u.username === 'admin')) {
      users.push({
        id: 'admin-opw',
        username: 'admin',
        password: 'admin@iceonwheels',
        role: 'admin',
        name: 'Admin User'
      });
    }
    localStorage.setItem('adminUsers', JSON.stringify(users));

    const user = users.find((u: User) => u.username === username && u.password === password);

    if (user) {
      localStorage.setItem('adminUser', JSON.stringify(user));
      router.push('/admin/dashboard');
    } else {
      setError('Invalid username or password');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src="/logo.jpg" alt="Ice on Wheels" className="mx-auto h-16 w-16 rounded-full" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your username"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-9 text-gray-500 hover:text-blue-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3C5 3 1.73 7.11 1.05 10.29a1 1 0 000 .42C1.73 12.89 5 17 10 17s8.27-4.11 8.95-7.29a1 1 0 000-.42C18.27 7.11 15 3 10 3zm0 12c-3.87 0-7.16-3.13-7.87-6C2.84 7.13 6.13 4 10 4s7.16 3.13 7.87 6c-.71 2.87-4 6-7.87 6zm0-10a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4.03 3.97a.75.75 0 011.06 0l10.94 10.94a.75.75 0 01-1.06 1.06l-1.2-1.2A8.13 8.13 0 0110 17c-5 0-8.27-4.11-8.95-7.29a1 1 0 010-.42C1.73 7.11 5 3 10 3c1.61 0 3.13.41 4.47 1.13l-1.44 1.44A6.13 6.13 0 0010 4c-3.87 0-7.16 3.13-7.87 6 .71 2.87 4 6 7.87 6 1.61 0 3.13-.41 4.47-1.13l-1.44-1.44A6.13 6.13 0 0110 16c-3.87 0-7.16-3.13-7.87-6 .71-2.87 4-6 7.87-6 1.61 0 3.13.41 4.47 1.13l-1.44 1.44A6.13 6.13 0 0010 4z" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Demo info removed for security */}
        </form>
      </div>
    </div>
  );
}