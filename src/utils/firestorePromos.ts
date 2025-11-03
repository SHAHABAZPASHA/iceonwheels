import { db } from "./firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { AdminPromoCode } from "../types";

const PROMO_COLLECTION = "promoCodes";

export async function fetchPromoCodes(): Promise<AdminPromoCode[]> {
  const snapshot = await getDocs(collection(db, PROMO_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminPromoCode));
}

export async function addPromoCode(promo: Omit<AdminPromoCode, "id">) {
  await addDoc(collection(db, PROMO_COLLECTION), promo);
}

export async function updatePromoCode(id: string, promo: Partial<AdminPromoCode>) {
  await updateDoc(doc(db, PROMO_COLLECTION, id), promo);
}

export async function deletePromoCode(id: string) {
  await deleteDoc(doc(db, PROMO_COLLECTION, id));
}
