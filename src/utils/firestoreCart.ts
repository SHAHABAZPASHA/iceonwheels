import { db } from "./firebase";
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { CartItem } from "../types";

const CART_COLLECTION = "carts";

export async function fetchCart(userId: string): Promise<CartItem[]> {
  const cartDoc = await getDoc(doc(db, CART_COLLECTION, userId));
  if (!cartDoc.exists()) return [];
  return cartDoc.data().items || [];
}

export async function saveCart(userId: string, items: CartItem[]) {
  await setDoc(doc(db, CART_COLLECTION, userId), { items });
}

export async function updateCartItem(userId: string, item: CartItem) {
  const cartDoc = await getDoc(doc(db, CART_COLLECTION, userId));
  let items: CartItem[] = cartDoc.exists() ? cartDoc.data().items : [];
  const idx = items.findIndex(i => i.id === item.id);
  if (idx !== -1) items[idx] = item;
  else items.push(item);
  await setDoc(doc(db, CART_COLLECTION, userId), { items });
}

export async function removeCartItem(userId: string, itemId: string) {
  const cartDoc = await getDoc(doc(db, CART_COLLECTION, userId));
  let items: CartItem[] = cartDoc.exists() ? cartDoc.data().items : [];
  items = items.filter(i => i.id !== itemId);
  await setDoc(doc(db, CART_COLLECTION, userId), { items });
}
