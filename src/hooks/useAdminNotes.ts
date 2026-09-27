import { useEffect, useState } from "react";
import type { Note } from "../lib/notes";
import { deleteNote, subscribeLatestNotes } from "../services/db";

/** Admin: en yeni şikayet ve öneriler. */
export function useAdminNotes(enabled: boolean) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    return subscribeLatestNotes(
      (n) => {
        setNotes(n);
        setLoading(false);
      },
      (err) => {
        console.error("[Kalometre] Notlar okunamadı", err);
        setError("Notlar okunamadı.");
        setLoading(false);
      },
    );
  }, [enabled]);

  const remove = async (id: string) => {
    try {
      await deleteNote(id);
    } catch (err) {
      console.error(err);
      setError("Not silinemedi.");
    }
  };

  return { notes, loading, error, remove };
}
