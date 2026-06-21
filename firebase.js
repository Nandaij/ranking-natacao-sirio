import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVEO6qFySeOlPuRFZkWXVlerM4yWJNQ88",
  authDomain: "natacao-f54cb.firebaseapp.com",
  projectId: "natacao-f54cb",
  storageBucket: "natacao-f54cb.firebasestorage.app",
  messagingSenderId: "421759334454",
  appId: "1:421759334454:web:a1eafc89b96f5cceba0097",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
