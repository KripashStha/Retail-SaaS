// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCW2AyU7qBWHvQV2jjlc9BM_4-NfiOX81s",
  authDomain: "fyp-ims-eede9.firebaseapp.com",
  projectId: "fyp-ims-eede9",
  storageBucket: "fyp-ims-eede9.firebasestorage.app",
  messagingSenderId: "243924668647",
  appId: "1:243924668647:web:3db517b647740a6fd8d242"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };