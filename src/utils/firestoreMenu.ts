import { db } from "./firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { IceCreamItem } from "../types";

const MENU_COLLECTION = "menuItems";

export async function fetchMenuItems(): Promise<IceCreamItem[]> {
  const snapshot = await getDocs(collection(db, MENU_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IceCreamItem));
}

export async function addMenuItem(item: Omit<IceCreamItem, "id">) {
  await addDoc(collection(db, MENU_COLLECTION), item);
}

export async function updateMenuItem(id: string, item: Partial<IceCreamItem>) {
  await updateDoc(doc(db, MENU_COLLECTION, id), item);
}

export async function deleteMenuItem(id: string) {
  await deleteDoc(doc(db, MENU_COLLECTION, id));
}
