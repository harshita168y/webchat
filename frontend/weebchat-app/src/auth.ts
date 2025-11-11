import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  getIdToken
} from "firebase/auth";
import { auth } from "./firebaseConfig";

export const signInAnon = () => signInAnonymously(auth);

export const signUpEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signInEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

// Observe auth state (use in App root)
export const observeAuth = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);

export async function fetchIdToken() {
  const user = auth.currentUser;
  if (!user) return null;

  const token = await getIdToken(user, true);
  console.log("\n🔥🔥 FULL FIREBASE ID TOKEN 🔥🔥\n");
  console.log(token);
  console.log("\n------------------------------------------\n");
  return token;
}