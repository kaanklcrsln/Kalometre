import { useEffect, useState } from "react";
import { isKaloPlusActive, type EntitlementDoc } from "../lib/entitlement";
import { subscribeEntitlement } from "../services/db";

/** Kullanıcının Kalo+ üyeliği. Okunamazsa (ör. ağ/kural hatası) güvenli tarafta kalınır: üye değil. */
export function useEntitlement(uid: string) {
  const [doc, setDoc] = useState<Partial<EntitlementDoc> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      subscribeEntitlement(
        uid,
        (d) => {
          setDoc(d);
          setLoading(false);
        },
        (err) => {
          console.error("[Kalometre] Üyelik okunamadı", err);
          setDoc(null);
          setLoading(false);
        },
      ),
    [uid],
  );

  // Süre bitimi sunucu güncellemesini beklemeden de kontrol edilir.
  return { kaloPlus: isKaloPlusActive(doc, Date.now()), loading };
}
