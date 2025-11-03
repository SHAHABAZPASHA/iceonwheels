
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { fetchMenuItems } from "../../../../utils/firestoreMenu";
import { IceCreamItem } from "../../../../types";

export default function MenuManagement() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [menuItems, setMenuItems] = useState<IceCreamItem[]>([]);
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
  }, [user]);

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Menu Management</h1>
      <ul>
        {menuItems.map((item) => (
          <li key={item.id}>
            {item.name} - ₹{item.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
