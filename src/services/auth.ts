// Kimlik doğrulama: kullanıcı adı + şifre (arka planda E-posta/Şifre sağlayıcısı).
// Uygulamanın geri kalanı firebase/auth'a doğrudan dokunmaz.

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
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

/**
 * Hesap admin mi? Yetki Firebase Auth özel yetkisi (custom claim) olarak token'da taşınır ve yalnızca
 * Admin SDK ile verilebilir (scripts/set-admin.mjs). force: token'ı yenileyip en güncel yetkiyi al.
 */
export async function isAdminUser(force = false): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  const token = await user.getIdTokenResult(force);
  return token.claims.admin === true;
}

/**
 * Şifre değiştir. Firebase, hassas işlemden önce kimliğin yeniden doğrulanmasını ister;
 * bu yüzden mevcut şifre ile tekrar doğrulanır, sonra yeni şifre yazılır.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Oturum bulunamadı.");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  await updatePassword(user, newPassword);
}

export function passwordChangeErrorMessage(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Mevcut şifre hatalı.";
    case "auth/weak-password":
      return "Yeni şifre en az 6 karakter olmalı.";
    case "auth/too-many-requests":
      return "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.";
    case "auth/network-request-failed":
      return "İnternet bağlantısı yok gibi görünüyor.";
    case "auth/requires-recent-login":
      return "Güvenlik için çıkış yapıp tekrar giriş yap, sonra yeniden dene.";
    default:
      return "Şifre değiştirilemedi. Tekrar dene.";
  }
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
