import { useEffect, useState } from "react";
import { onAuthChange, type AuthUser } from "../services/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthChange((u) => {
        setUser(u);
        setLoading(false);
      }),
    [],
  );

  return { user, loading };
}
