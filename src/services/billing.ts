// Uygulama içi satın alma. Uygulamanın geri kalanı yalnızca bu arayüzü kullanır.
//
// Planlanan akış (henüz uygulanmadı):
//  1. Android (Capacitor) sürümünde bir Google Play Billing eklentisi `GooglePlayBillingProvider`
//     olarak buraya bağlanır; `purchase()` Play satın alma penceresini açar.
//  2. Satın alma tamamlanınca eklentinin verdiği purchaseToken bir Cloud Function'a gönderilir.
//  3. Cloud Function token'ı Google Play Developer API ile doğrular, aboneliği onaylar (acknowledge)
//     ve Admin SDK ile `entitlements/{uid}` dokümanını yazar. Yenileme/iptal bildirimleri
//     (Real-time Developer Notifications) da aynı dokümanı günceller.
//  4. İstemci bu dokümanı dinlediği için (useEntitlement) kilit kendiliğinden açılır.
//
// Güvenlik: istemci üyeliği asla kendisi yazmaz; Firestore kuralları buna izin vermez.

import { KALO_PLUS } from "../config/plans";

export interface BillingProduct {
  id: string;
  /** Mağazanın yerelleştirdiği fiyat, ör. "₺200,00/ay". */
  priceLabel: string;
}

export type PurchaseResult =
  /** Ödeme alındı; kilit, sunucu üyeliği yazınca açılır. */
  | { status: "pending-verification" }
  | { status: "cancelled" }
  | { status: "unavailable"; message: string };

export interface BillingProvider {
  isAvailable(): Promise<boolean>;
  getProduct(productId: string): Promise<BillingProduct | null>;
  purchase(productId: string, uid: string): Promise<PurchaseResult>;
}

/** Google Play bağlanana kadar kullanılan sağlayıcı: satın alma yapılamaz, bilgi mesajı döner. */
const comingSoonProvider: BillingProvider = {
  async isAvailable() {
    return false;
  },
  async getProduct() {
    return null;
  },
  async purchase() {
    return {
      status: "unavailable",
      message: `${KALO_PLUS.name} yakında Google Play üzerinden satın alınabilecek.`,
    };
  },
};

/** Etkin satın alma sağlayıcısı. Capacitor/Android sürümünde Google Play sağlayıcısı döndürülecek. */
export function getBillingProvider(): BillingProvider {
  return comingSoonProvider;
}
