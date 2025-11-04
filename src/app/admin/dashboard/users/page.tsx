'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/types/index';

export default function UsersManagement() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Map FirebaseUser to custom User type
        const mappedUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email || 'unknown',
          password: '', // Not available from Firebase
          role: 'admin', // Default role, adjust as needed
          name: firebaseUser.displayName || 'Unknown',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
          active: true,
          lastLogin: '',
          createdAt: ''
        };
        setCurrentUser(mappedUser);
      } else {
        setCurrentUser(null);
        router.push('/admin/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isLoading && currentUser === null) {
      router.push('/admin/login');
      return;
    }

    if (!isLoading && currentUser) {
      // Check permissions - only owner and admin can manage users
      if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
        router.push('/admin/dashboard');
        return;
      }
    }
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    if (!currentUser) return;

    // Force-reset user list to ensure admin exists
      // Always set Irfan as admin in localStorage
      const defaultUsers: User[] = [
        {
          id: 'irfan-id',
          username: 'irfan',
          password: 'irfan123',
          role: 'admin',
          name: 'Irfan',
          active: true,
          lastLogin: '',
          createdAt: new Date().toISOString()
        },
        {
          id: 'admin-opw',
          username: 'admin',
          password: 'admin@iceonwheels',
          role: 'admin',
          name: 'Admin User',
          active: true,
          lastLogin: '',
          createdAt: new Date().toISOString()
        }
      ];
    // Force Irfan to be admin in localStorage
    const updatedUsers = defaultUsers.map(u =>
      u.username === 'irfan' ? { ...u, role: 'admin' as 'admin' } : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
  }, [currentUser, router]);

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
  };

  const handleAddUser = (newUser: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Only admin can add users.');
      return;
    }
    // Prevent duplicate usernames
    if (users.some(u => u.username === newUser.username)) {
      alert('Username already exists. Please choose a different one.');
      return;
    }
    if (!newUser.password || newUser.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    const user: User = {
      ...newUser,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastLogin: ''
    };
    const updatedUsers = [...users, user];
    saveUsers(updatedUsers);
    setIsAddingUser(false);
  };

  const handleEditUser = (updatedUser: User) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Only admin can edit users.');
      return;
    }
    const updatedUsers = users.map(user =>
      user.id === updatedUser.id ? updatedUser : user
    );
    saveUsers(updatedUsers);
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Only admin can delete users.');
      return;
    }
    // Prevent deleting the current user
    if (currentUser && currentUser.id === id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const updatedUsers = users.filter(user => user.id !== id);
      saveUsers(updatedUsers);
    }
  };

  const toggleUserStatus = (id: string) => {
    // Prevent deactivating the current user
    if (currentUser && currentUser.id === id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    const updatedUsers = users.map(user =>
      user.id === id ? { ...user, active: !user.active } : user
    );
    saveUsers(updatedUsers);
  };

  const resetUserPassword = (id: string) => {
    const newPassword = prompt('Enter new password for this user:');
    if (newPassword && newPassword.length >= 6) {
      const updatedUsers = users.map(user =>
        user.id === id ? { ...user, password: newPassword } : user
      );
      saveUsers(updatedUsers);
      alert('Password has been reset successfully.');
    } else if (newPassword) {
      alert('Password must be at least 6 characters long.');
    }
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'partner': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || !currentUser) {
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
              <h1 className="text-xl font-bold text-gray-900">User Management</h1>
            </div>
            <button
              onClick={() => setIsAddingUser(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              + Add New User
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Users Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <p className="text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length + 1}</p> {/* +1 for current user */}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="text-3xl mr-4 text-green-600">✅</div>
              <div>
                <p className="text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(user => user.active).length + 1}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="text-3xl mr-4 text-purple-600">👑</div>
              <div>
                <p className="text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(user => user.role === 'admin').length + (currentUser.role === 'admin' ? 1 : 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="text-3xl mr-4 text-blue-600">🤝</div>
              <div>
                <p className="text-gray-600">Partners</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(user => user.role === 'partner').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Current User Row */}
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
                      <div className="text-sm text-gray-500">@{currentUser.username} (You)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(currentUser.role)}`}>
                      {currentUser.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{currentUser.email || 'N/A'}</div>
                    <div className="text-gray-500">{currentUser.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Current Session
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">
                    N/A
                  </td>
                </tr>

                {/* Other Users */}
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{user.email || 'N/A'}</div>
                      <div className="text-gray-500">{user.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => resetUserPassword(user.id)}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          Reset PW
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={user.active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}
                        >
                          {user.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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

        {/* Add/Edit Modal */}
        {(isAddingUser || editingUser) && (
          <UserModal
            user={editingUser}
            onSave={editingUser ? handleEditUser : handleAddUser}
            onClose={() => {
              setIsAddingUser(false);
              setEditingUser(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

interface UserModalProps {
  user?: User | null;
  onSave: (user: User) => void;
  onClose: () => void;
}

function UserModal({ user, onSave, onClose }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: user?.password || '',
    role: user?.role || 'manager',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    active: user?.active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    const baseUserData = {
      username: formData.username,
      password: formData.password,
      role: formData.role,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      active: formData.active
    };

    if (user) {
      // Editing existing user
      const userData: User = {
        ...baseUserData,
        id: user.id,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };
      onSave(userData);
    } else {
      // Adding new user
      const userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'> = baseUserData;
      onSave(userData as User);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {user ? 'Edit User' : 'Add New User'}
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
              Full Name
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
              Username
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {user ? '(leave blank to keep current)' : ''}
            </label>
            <input
              type="password"
              required={!user}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="manager">Manager</option>
              <option value="partner">Partner</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              Active user account
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
            >
              {user ? 'Update User' : 'Create User'}
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