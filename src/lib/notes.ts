// Şikayet ve öneri notları. Günde 1 sınırı Firestore kuralında zorunlu: not kimliği
// "<uid>_<UTC gün numarası>" olmalı ve güncellenemez (bkz. firestore.rules > notes).

export type NoteType = "complaint" | "suggestion";

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  complaint: "Şikayet",
  suggestion: "Öneri",
};

export const NOTE_MIN = 3;
export const NOTE_MAX = 1000;

export interface Note {
  id: string;
  uid: string;
  username: string;
  name: string;
  type: NoteType;
  text: string;
  createdAtMs: number | null;
}

/** UTC gün numarası (Türkiye saatiyle 03:00'te değişir). */
export function utcDayNumber(nowMs: number): number {
  return Math.floor(nowMs / 86_400_000);
}

export function todayNoteId(uid: string, nowMs: number): string {
  return `${uid}_${utcDayNumber(nowMs)}`;
}

export function validateNote(text: string): string | null {
  const t = text.trim();
  if (t.length < NOTE_MIN) return `En az ${NOTE_MIN} karakter yaz.`;
  if (t.length > NOTE_MAX) return `En fazla ${NOTE_MAX} karakter yazabilirsin.`;
  return null;
}
