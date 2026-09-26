// Firebase Auth kullanıcı adını desteklemez; kullanıcı adı sabit bir alan adıyla
// sentetik e-postaya çevrilip E-posta/Şifre sağlayıcısında saklanır. Bu adrese e-posta gönderilmez.

// Projenin kendi alan adı: üçüncü kişiye ait bir alan adına asla e-posta gitmez.
export const USERNAME_EMAIL_DOMAIN = "users.kalometre.firebaseapp.com";
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 6;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLocaleLowerCase("tr-TR");
}

/** Yalnızca a-z, 0-9, nokta ve alt çizgi; Türkçe karakter yok (e-posta uyumu için). */
export function validateUsername(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (u.length < USERNAME_MIN || u.length > USERNAME_MAX) {
    return `Kullanıcı adı ${USERNAME_MIN}–${USERNAME_MAX} karakter olmalı.`;
  }
  if (!/^[a-z0-9._]+$/.test(u)) {
    return "Kullanıcı adında yalnızca İngilizce harf, rakam, nokta ve alt çizgi kullanabilirsin.";
  }
  if (/^[._]|[._]$|\.\./.test(u)) {
    return "Kullanıcı adı nokta veya alt çizgiyle başlayıp bitemez.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  return password.length >= PASSWORD_MIN ? null : `Şifre en az ${PASSWORD_MIN} karakter olmalı.`;
}

export function usernameToEmail(raw: string): string {
  return `${normalizeUsername(raw)}@${USERNAME_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string | null): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  return domain === USERNAME_EMAIL_DOMAIN ? local : email;
}
