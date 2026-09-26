// Kimlik doğrulama: kullanıcı adı + şifre (arka planda E-posta/Şifre sağlayıcısı).
// Uygulamanın geri kalanı firebase/auth'a doğrudan dokunmaz.

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../config/firebase";
import { emailToUsername, usernameToEmail } from "../lib/username";

export interface AuthUser {
  uid: string;
  username: string;
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) =>
    callback(user ? { uid: user.uid, username: emailToUsername(user.email) } : null),
  );
}

export async function signIn(username: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
}

export async function signUp(username: string, password: string): Promise<void> {
  await createUserWithEmailAndPassword(auth, usernameToEmail(username), password);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function authErrorMessage(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Kullanıcı adı veya şifre hatalı.";
    case "auth/email-already-in-use":
      return "Bu kullanıcı adı alınmış. Başka bir tane dene.";
    case "auth/weak-password":
      return "Şifre en az 6 karakter olmalı.";
    case "auth/too-many-requests":
      return "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.";
    case "auth/network-request-failed":
      return "İnternet bağlantısı yok gibi görünüyor.";
    case "auth/operation-not-allowed":
      return "Giriş yöntemi Firebase'de etkin değil.";
    default:
      return "Giriş yapılamadı. Tekrar dene.";
  }
}
