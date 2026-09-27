// Android'de App Check: tarayıcıdaki reCAPTCHA Enterprise WebView'da çalışmaz. Token'ı Android'in kendi
// doğrulaması (Play Integrity) üretir; bu dosya onu Firebase JS SDK'sına (Firestore, AI Logic) aktarır.
//
// Geliştirme derlemesi (npm run android:dev) Play Integrity yerine debug sağlayıcısını kullanır: cihaz ilk
// açılışta logcat'e bir debug secret yazar, bu secret Firebase Console > App Check'e bir kez eklenir.
// Mağaza derlemesinde (npm run android:build) debug sağlayıcı hiç açılmaz.

import { CustomProvider } from "firebase/app-check";

const useDebugProvider = import.meta.env.VITE_NATIVE_APPCHECK_DEBUG === "true";
/** Native SDK süre vermezse token'ı bu kadar geçerli say (Firebase varsayılanı ~1 saat). */
const FALLBACK_TTL_MS = 30 * 60 * 1000;

let ready: Promise<void> | null = null;

async function nativeToken() {
  const { FirebaseAppCheck } = await import("@capacitor-firebase/app-check");
  ready ??= FirebaseAppCheck.initialize({ debugToken: useDebugProvider, isTokenAutoRefreshEnabled: true });
  await ready;
  const { token, expireTimeMillis } = await FirebaseAppCheck.getToken({ forceRefresh: false });
  return { token, expireTimeMillis: expireTimeMillis ?? Date.now() + FALLBACK_TTL_MS };
}

export function nativeAppCheckProvider(): CustomProvider {
  return new CustomProvider({ getToken: nativeToken });
}
