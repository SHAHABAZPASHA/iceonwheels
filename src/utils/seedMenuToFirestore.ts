import { db } from "./firebase";
import { iceCreamMenu } from "../data/menu";
import { addDoc, collection } from "firebase/firestore";

async function seedMenu() {
  for (const item of iceCreamMenu) {
    await addDoc(collection(db, "menuItems"), item);
    console.log(`Seeded: ${item.name}`);
  }
  console.log("Seeding complete!");
}

seedMenu();
