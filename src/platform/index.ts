// Web ve Android (Capacitor) ayrımı. Android'e özel her şey bu klasördedir ve yalnızca isNative iken
// yüklenir; web sürümü (Firebase Hosting) aynen çalışır.

import { Capacitor } from "@capacitor/core";

/** Android uygulaması içinde mi çalışıyoruz? Tarayıcıda false. */
export const isNative = Capacitor.isNativePlatform();

/** Android'e özel davranışları (geri tuşu, dış linkler, sistem çubukları) başlatır; web'de hiçbir şey yapmaz. */
export function setupPlatform(): void {
  if (!isNative) return;
  void import("./android").then((m) => m.setupAndroid());
}
