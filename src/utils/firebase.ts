import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB05HWexjeD0nVKvLDfbCzzNzfYGzFhe1o",
  authDomain: "iceonwheels-a635d.firebaseapp.com",
  projectId: "iceonwheels-a635d",
  storageBucket: "iceonwheels-a635d.firebasestorage.app",
  messagingSenderId: "377895661693",
  appId: "1:377895661693:web:92976a68d0ac495e480114"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
