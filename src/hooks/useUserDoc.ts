import { useEffect, useState } from "react";
import { subscribeUser } from "../services/db";
import type { UserDoc } from "../types";

export function useUserDoc(uid: string | null) {
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setUserDoc(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeUser(
      uid,
      (doc) => {
        setUserDoc(doc);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Profil yüklenemedi.");
        setLoading(false);
      },
    );
  }, [uid]);

  return { userDoc, loading, error };
}
