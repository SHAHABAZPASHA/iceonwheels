
"use client";
import { useState, useEffect } from "react";
import { fetchMenuItems } from "../../../../utils/firestoreMenu";
import { IceCreamItem } from "../../../../types";

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<IceCreamItem[]>([]);

  useEffect(() => {
    fetchMenuItems().then(setMenuItems);
  }, []);

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
