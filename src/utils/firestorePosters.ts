import { db } from "./firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Poster } from "../types";

const POSTER_COLLECTION = "posters";

export async function fetchPosters(): Promise<Poster[]> {
  const snapshot = await getDocs(collection(db, POSTER_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poster));
}

export async function addPoster(poster: Omit<Poster, "id">) {
  await addDoc(collection(db, POSTER_COLLECTION), poster);
}

export async function updatePoster(id: string, poster: Partial<Poster>) {
  await updateDoc(doc(db, POSTER_COLLECTION, id), poster);
}

export async function deletePoster(id: string) {
  await deleteDoc(doc(db, POSTER_COLLECTION, id));
}
