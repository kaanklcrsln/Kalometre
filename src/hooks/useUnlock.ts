import { useEffect, useState } from "react";
import { KALO_PLUS } from "../config/plans";
import type { UnlockRequest } from "../lib/entitlement";
import { getBillingProvider } from "../services/billing";
import { requestUnlock, subscribeUnlockRequest } from "../services/db";

/**
 * "Kilidi aç" akışı.
 * - Google Play bağlıysa satın alma başlatılır (kilidi sunucunun yazdığı üyelik açar).
 * - Bağlı değilse (şimdilik) admin onayı istenir; admin onaylayınca üyelik yazılır ve kilit kendiliğinden açılır.
 */
export function useUnlock(uid: string, username: string, name: string) {
  const [request, setRequest] = useState<UnlockRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeUnlockRequest(uid, setRequest, (err) => {
        console.error("[Kalometre] Onay isteği okunamadı", err);
      }),
    [uid],
  );

  const unlock = async () => {
    setBusy(true);
    setError(null);
    try {
      const billing = getBillingProvider();
      if (await billing.isAvailable()) {
        const result = await billing.purchase(KALO_PLUS.productId, uid);
        if (result.status === "unavailable") setError(result.message);
        return;
      }
      await requestUnlock(uid, username, name, request);
    } catch (err) {
      console.error("[Kalometre] Kilit açma isteği başarısız", err);
      setError("İstek gönderilemedi. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  return { status: request?.status ?? null, busy, error, unlock };
}
