import { useCallback, useEffect, useState } from "react";
import {
  listDisabledUsers,
  listUsersForAdmin,
  removeUserAsAdmin,
  restoreUserAsAdmin,
  type AdminUserRow,
  type DisabledUserRow,
} from "../services/db";

/** Admin: kayıtlı kullanıcılar ve kaldırılmış hesaplar. Panel açıkken yüklenir. */
export function useAdminUsers(adminUid: string, open: boolean) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [disabled, setDisabled] = useState<DisabledUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, d] = await Promise.all([listUsersForAdmin(), listDisabledUsers()]);
      const disabledIds = new Set(d.map((x) => x.uid));
      setUsers(u.filter((x) => !disabledIds.has(x.uid)));
      setDisabled(d);
    } catch (err) {
      console.error("[Kalometre] Kullanıcılar okunamadı", err);
      setError("Kullanıcılar okunamadı. Admin yetkin olduğundan ve kuralların güncel olduğundan emin ol.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const run = async (uid: string, action: () => Promise<void>) => {
    setBusyUid(uid);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message.startsWith("Kendini") ? err.message : "İşlem yapılamadı. Tekrar dene.");
    } finally {
      setBusyUid(null);
    }
  };

  return {
    users,
    disabled,
    loading,
    busyUid,
    error,
    remove: (row: AdminUserRow) => run(row.uid, () => removeUserAsAdmin(adminUid, row.uid, row.username)),
    restore: (row: DisabledUserRow) => run(row.uid, () => restoreUserAsAdmin(row.uid)),
  };
}
