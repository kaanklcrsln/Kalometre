// Onboarding ve ayarlar formlarında ortak alan doğrulamaları.

import { inRange, parseDecimal } from "./numbers";

export const LIMITS = {
  heightCm: [100, 250],
  weightKg: [30, 300],
  bodyFatPct: [3, 70],
  age: [10, 100],
} as const;

export function validateName(name: string): string | null {
  return name.trim().length >= 1 ? null : "Adını yaz.";
}

export function validateAge(value: string): string | null {
  const [min, max] = LIMITS.age;
  const n = parseDecimal(value);
  return Number.isInteger(n) && inRange(n, min, max) ? null : `Yaş ${min}–${max} arasında olmalı.`;
}

export function validateHeight(value: string): string | null {
  const [min, max] = LIMITS.heightCm;
  return inRange(parseDecimal(value), min, max) ? null : `Boy ${min}–${max} cm arasında olmalı.`;
}

export function validateWeight(value: string): string | null {
  const [min, max] = LIMITS.weightKg;
  return inRange(parseDecimal(value), min, max) ? null : `Kilo ${min}–${max} kg arasında olmalı.`;
}

export function validateBodyFat(value: string): string | null {
  const [min, max] = LIMITS.bodyFatPct;
  return inRange(parseDecimal(value), min, max) ? null : `Yağ oranı %${min}–%${max} arasında olmalı.`;
}
