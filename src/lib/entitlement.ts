// Üyelik (entitlement) kuralları. Doküman yalnızca sunucu tarafından yazılır (bkz. firestore.rules);
// istemci sadece okur ve burada geçerli olup olmadığına karar verir.

export type EntitlementStatus = "active" | "grace" | "on_hold" | "paused" | "canceled" | "expired";

export interface EntitlementDoc {
  plan: "kalo_plus";
  status: EntitlementStatus;
  /** Son geçerlilik anı (ms). Google Play aboneliğinin expiryTime değeri. */
  expiresAtMs: number;
  /** google_play: satın alma (Cloud Function yazar) · admin: onay isteğiyle satın alımsız. */
  source: "google_play" | "admin";
}

/**
 * Kalo+ açık mı? "active" ve Play'in ödeme sorununda tanıdığı ek süre ("grace") erişim verir;
 * her durumda bitiş zamanı geçmemiş olmalı. Beklenmeyen/eksik veri erişim vermez.
 */
export function isKaloPlusActive(doc: Partial<EntitlementDoc> | null | undefined, nowMs: number): boolean {
  if (!doc || doc.plan !== "kalo_plus") return false;
  if (doc.status !== "active" && doc.status !== "grace") return false;
  return typeof doc.expiresAtMs === "number" && doc.expiresAtMs > nowMs;
}

/** Admin onayıyla verilen satın alımsız üyeliğin süresi. */
export const ADMIN_GRANT_DAYS = 30;

export type UnlockRequestStatus = "pending" | "approved" | "rejected";

/** unlockRequests/{uid} */
export interface UnlockRequest {
  uid: string;
  username: string;
  name: string;
  status: UnlockRequestStatus;
  /** ms; sunucu zamanı henüz gelmediyse null. */
  createdAtMs: number | null;
}
