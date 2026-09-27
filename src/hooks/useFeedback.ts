import { FirebaseError } from "firebase/app";
import { useEffect, useState } from "react";
import { validateNote, type Note, type NoteType } from "../lib/notes";
import { submitNote, subscribeTodayNote } from "../services/db";

/** Ayarlar > Şikayet ve öneri: günde en fazla 1 not. */
export function useFeedback(uid: string, username: string, name: string) {
  const [todayNote, setTodayNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<NoteType>("suggestion");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeTodayNote(
        uid,
        (n) => {
          setTodayNote(n);
          setLoading(false);
        },
        (err) => {
          console.error("[Kalometre] Not okunamadı", err);
          setLoading(false);
        },
      ),
    [uid],
  );

  const submit = async () => {
    const invalid = validateNote(text);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitNote(uid, username, name, type, text);
      setText("");
    } catch (err) {
      console.error("[Kalometre] Not gönderilemedi", err);
      const denied = err instanceof FirebaseError && err.code === "permission-denied";
      setError(denied ? "Bugün zaten bir not gönderdin. Yarın tekrar yazabilirsin." : "Gönderilemedi. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  return {
    loading,
    sentToday: todayNote !== null,
    todayNote,
    type,
    text,
    busy,
    error,
    setType: (t: NoteType) => setType(t),
    setText: (v: string) => {
      setText(v);
      setError(null);
    },
    submit,
  };
}
