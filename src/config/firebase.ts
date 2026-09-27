import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

export const usingEmulators = env.VITE_USE_EMULATORS === "true";

// App Check, diğer servislerden önce başlatılmalı. Emülatörler App Check istemez; emülatör modunda
// (sahte proje kimliği) gerçek App Check sunucusu token vermeyeceği için hiç başlatılmaz.
export let appCheck: AppCheck | null = null;
const siteKey = env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
// Yalnızca geliştirmede (npm run dev): localhost'ta reCAPTCHA yerine App Check debug token'ı kullanılır.
// VITE_APPCHECK_DEBUG_TOKEN verilirse o sabit token kullanılır (Firebase Console > App Check > Debug token'lara
// bir kez eklenir); verilmezse SDK tarayıcı başına rastgele bir token üretip konsola yazar.
// Debug ayarları .env.development.local'dadır ve import.meta.env'e doğrudan erişilir: üretimde bu blok
// derlemeden tamamen silinir, token pakete girmez.
if (import.meta.env.DEV && import.meta.env.VITE_APPCHECK_DEBUG === "true") {
  (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string }).FIREBASE_APPCHECK_DEBUG_TOKEN =
    import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
}
if (siteKey && !usingEmulators) {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else if (!usingEmulators) {
  console.warn("[Kalometre] VITE_RECAPTCHA_ENTERPRISE_SITE_KEY yok; App Check kapalı. AI çağrıları App Check zorunluysa reddedilir.");
}

export const auth = getAuth(app);
export const firestore = initializeFirestore(app, {
  // Opsiyonel alanlar (ör. bodyFatPct) undefined ise hata vermek yerine atla.
  ignoreUndefinedProperties: true,
});

if (usingEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
}
