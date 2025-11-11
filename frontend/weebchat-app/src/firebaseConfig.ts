import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence, browserLocalPersistence } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyAtUvyO7d5W0OKJGZel_EvBtTV2OZylbBo",
  authDomain: "weeb-chat-dac61.firebaseapp.com",
  projectId: "weeb-chat-dac61",
  storageBucket:"weeb-chat-dac61.appspot.com",
  messagingSenderId: "62907226263",
  appId: "1:62907226263:web:21ead7f3b07d10fca471d2", 
  measurementId: "G-PPFJYD651J"

}
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Default: session-based only (resets after app close)
setPersistence(auth, browserSessionPersistence);

export { auth, setPersistence, browserLocalPersistence, browserSessionPersistence };