import { useEffect, useState } from "react";
import { isAdminUser } from "../services/auth";

/**
 * Giriş yapan hesap admin mi? Token açılışta bir kez yenilenir; böylece admin yetkisi verildikten sonra
 * çıkış yapıp girmeye gerek kalmaz. Arayüz içindir; asıl koruma Firestore kurallarındadır.
 * null: henüz kontrol ediliyor.
 */
export function useIsAdmin(uid: string): boolean | null {
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    setAdmin(null);
    isAdminUser(true)
      .then((v) => alive && setAdmin(v))
      .catch(() => alive && setAdmin(false));
    return () => {
      alive = false;
    };
  }, [uid]);
  return admin;
}
