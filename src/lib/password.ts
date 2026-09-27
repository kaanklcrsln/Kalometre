import { validatePassword } from "./username";

/** Şifre değiştirme formu doğrulaması; sorun yoksa null. */
export function validatePasswordChange(current: string, next: string, repeat: string): string | null {
  if (!current) return "Mevcut şifreni gir.";
  const weak = validatePassword(next);
  if (weak) return weak;
  if (next === current) return "Yeni şifre mevcut şifreden farklı olmalı.";
  if (next !== repeat) return "Yeni şifreler birbiriyle aynı değil.";
  return null;
}
