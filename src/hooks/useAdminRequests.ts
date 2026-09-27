import { useEffect, useState } from "react";
import type { UnlockRequest } from "../lib/entitlement";
import { approveUnlock, rejectUnlock, subscribePendingUnlockRequests } from "../services/db";

/** Admin: bekleyen kilit açma istekleri ve karar işlemleri. */
export function useAdminRequests(adminUid: string, enabled: boolean) {
  const [requests, setRequests] = useState<UnlockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    return subscribePendingUnlockRequests(
      (r) => {
        setRequests(r);
        setLoading(false);
      },
      (err) => {
        console.error("[Kalometre] İstekler okunamadı", err);
        setError("İstekler okunamadı. Admin yetkin olduğundan emin ol.");
        setLoading(false);
      },
    );
  }, [enabled]);

  const decide = async (uid: string, approve: boolean) => {
    setBusyId(uid);
    setError(null);
    try {
      await (approve ? approveUnlock(adminUid, uid) : rejectUnlock(adminUid, uid));
    } catch (err) {
      console.error(err);
      setError("İşlem yapılamadı. Tekrar dene.");
    } finally {
      setBusyId(null);
    }
  };

  return {
    requests,
    loading,
    busyId,
    error,
    approve: (uid: string) => decide(uid, true),
    reject: (uid: string) => decide(uid, false),
  };
}
