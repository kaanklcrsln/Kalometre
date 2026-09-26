/** "72,5" ve "72.5" ikisini de kabul eder; geçersizse NaN. */
export function parseDecimal(value: string): number {
  const cleaned = value.trim().replace(",", ".");
  if (cleaned === "" || !/^-?\d+(\.\d+)?$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

export function inRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

/** 91.2 → "91,2" */
export function formatKg(value: number): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
}
