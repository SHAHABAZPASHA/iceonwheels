"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { fetchMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from "../../../../utils/firestoreMenu";
import { IceCreamItem } from "../../../../types";

export default function MenuManagement() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [menuItems, setMenuItems] = useState<IceCreamItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
        router.push("/admin/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchMenuItems().then(setMenuItems);
    }
  }, [user, isSaving]);

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  const handleAddItem = async () => {
    setIsSaving(true);
    const newItem = {
      name: '',
      price: 0,
      description: '',
      available: true,
      emoji: '',
      category: '',
      image: '',
      popularity: 0,
      customizations: [],
      createdAt: new Date().toISOString(),
    };
    await addMenuItem(newItem);
    setIsSaving(false);
  };

  const handleUpdateItem = async (id, updates) => {
    setIsSaving(true);
    await updateMenuItem(id, updates);
    setIsSaving(false);
  };

  const handleDeleteItem = async (id) => {
    setIsSaving(true);
    await deleteMenuItem(id);
    setIsSaving(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Menu Management</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleAddItem}
        disabled={isSaving}
      >
        Add New Item
      </button>
      <ul className="space-y-4">
        {menuItems.map((item) => (
          <li key={item.id} className="bg-white rounded shadow p-4 flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <input
                type="text"
                className="border px-2 py-1 rounded w-1/4"
                value={item.name}
                placeholder="Item Name"
                onChange={e => handleUpdateItem(item.id, { name: e.target.value })}
                disabled={isSaving}
              />
              <input
                type="number"
                className="border px-2 py-1 rounded w-20"
                value={item.price}
                placeholder="Price"
                onChange={e => handleUpdateItem(item.id, { price: Number(e.target.value) })}
                disabled={isSaving}
              />
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={item.available}
                  onChange={e => handleUpdateItem(item.id, { available: e.target.checked })}
                  disabled={isSaving}
                />
                Available
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      handleUpdateItem(item.id, { image: reader.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                disabled={isSaving}
              />
              {item.image && (
                <img src={item.image} alt="preview" className="w-12 h-12 object-cover rounded" />
              )}
              <button
                className="ml-auto px-2 py-1 bg-red-500 text-white rounded"
                onClick={() => handleDeleteItem(item.id)}
                disabled={isSaving}
              >
                Delete
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                className="border px-2 py-1 rounded w-20"
                value={item.popularity || 0}
                placeholder="Quantity"
                onChange={e => handleUpdateItem(item.id, { popularity: Number(e.target.value) })}
                disabled={isSaving}
              />
              <span className="text-gray-500">Quantity</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
