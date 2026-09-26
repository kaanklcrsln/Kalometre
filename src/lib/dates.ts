// Tarih yardımcıları. Tüm anahtarlar kullanıcının YEREL saat dilimine göre "yyyy-mm-dd".

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "yyyy-mm-dd" → yerel gece yarısı Date. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

export function addDaysToKey(key: string, days: number): string {
  return toDateKey(addDays(fromDateKey(key), days));
}

/** İki tarih anahtarı arasındaki gün farkı (b − a). */
export function daysBetween(a: string, b: string): number {
  const ms = fromDateKey(b).getTime() - fromDateKey(a).getTime();
  // Yaz saati geçişlerinde 23/25 saatlik günleri yuvarlayarak düzelt.
  return Math.round(ms / 86_400_000);
}

export function formatDateTr(key: string): string {
  return fromDateKey(key).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(key: string): string {
  return fromDateKey(key).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "2-digit" });
}
