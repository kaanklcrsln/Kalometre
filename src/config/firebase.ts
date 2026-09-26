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

// App Check, diğer servislerden önce başlatılmalı.
export let appCheck: AppCheck | null = null;
const siteKey = env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
if (env.DEV && env.VITE_APPCHECK_DEBUG === "true") {
  // Konsola bir debug token yazdırır; Firebase Console > App Check > Debug token'lara eklenmeli.
  (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
if (siteKey) {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else {
  console.warn("[Kalometre] VITE_RECAPTCHA_ENTERPRISE_SITE_KEY yok; App Check kapalı. AI çağrıları App Check zorunluysa reddedilir.");
}

export const auth = getAuth(app);
export const firestore = initializeFirestore(app, {
  // Opsiyonel alanlar (ör. bodyFatPct) undefined ise hata vermek yerine atla.
  ignoreUndefinedProperties: true,
});

export const usingEmulators = env.VITE_USE_EMULATORS === "true";
if (usingEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
}
