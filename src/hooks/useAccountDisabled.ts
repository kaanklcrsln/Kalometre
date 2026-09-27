import { useEffect, useState } from "react";
import { subscribeAccountDisabled } from "../services/db";

/** Hesap admin tarafından kaldırıldı mı? null: henüz bilinmiyor (giriş yoksa false). */
export function useAccountDisabled(uid: string | null): boolean | null {
  const [disabled, setDisabled] = useState<boolean | null>(uid ? null : false);
  useEffect(() => {
    if (!uid) {
      setDisabled(false);
      return;
    }
    setDisabled(null);
    return subscribeAccountDisabled(uid, setDisabled, (err) => {
      console.error("[Kalometre] Hesap durumu okunamadı", err);
      setDisabled(false);
    });
  }, [uid]);
  return disabled;
}
