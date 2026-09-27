// Bir hesaba admin yetkisi verir ya da geri alır (Firebase Auth özel yetkisi: admin: true).
// Bu yetkiyi yalnızca Admin SDK verebilir; uygulama içinden verilemez.
//
// Kullanım:
//   Emülatör:      npm run admin -- <kullanıcıadı> --emulator
//   Gerçek proje:  (PowerShell) $env:GOOGLE_APPLICATION_CREDENTIALS="C:\guvenli\kalometre-adminsdk.json"
//                  npm run admin -- <kullanıcıadı>
//   Geri almak:    ... --remove
//
// Hizmet hesabı anahtarı projenin TAM yöneticisidir: proje klasörüne koyma, git'e ekleme, kimseyle paylaşma.

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";

const EMAIL_DOMAIN = "users.kalometre.firebaseapp.com";

const args = process.argv.slice(2);
const username = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
const useEmulator = args.includes("--emulator");
const remove = args.includes("--remove");

if (!username || !/^[a-z0-9._]{3,20}$/.test(username)) {
  console.error("Kullanım: npm run admin -- <kullanıcıadı> [--emulator] [--remove]");
  process.exit(1);
}

let projectId;
if (useEmulator) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
  projectId = "demo-kalometre";
  initializeApp({ projectId });
} else {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      "GOOGLE_APPLICATION_CREDENTIALS ayarlı değil. Firebase Console > Proje ayarları > Hizmet hesapları >\n" +
        '"Yeni özel anahtar oluştur" ile indirdiğin JSON dosyasının yolunu ver (bkz. README).',
    );
    process.exit(1);
  }
  projectId = JSON.parse(readFileSync(".firebaserc", "utf8")).projects.default;
  initializeApp({ credential: applicationDefault(), projectId });
}

const auth = getAuth();
const email = `${username}@${EMAIL_DOMAIN}`;

try {
  const user = await auth.getUserByEmail(email);
  const claims = { ...(user.customClaims ?? {}) };
  if (remove) delete claims.admin;
  else claims.admin = true;
  await auth.setCustomUserClaims(user.uid, claims);
  // Geri alırken oturumları kapat: yeni token alınana kadar (en fazla 1 saat) eski yetki sürebilir.
  if (remove) await auth.revokeRefreshTokens(user.uid);
  console.log(
    `${remove ? "Admin yetkisi kaldırıldı" : "Admin yetkisi verildi"}: @${username} (uid ${user.uid}, proje ${projectId}${useEmulator ? ", emülatör" : ""})`,
  );
  if (!remove) console.log("Uygulamayı yenile; Ayarlar'da \"Onay istekleri\" görünür.");
} catch (err) {
  if (err?.code === "auth/user-not-found") {
    console.error(`@${username} bulunamadı. Önce uygulamada bu kullanıcı adıyla üye ol.`);
  } else {
    console.error("Yetki verilemedi:", err?.message ?? err);
  }
  process.exit(1);
}
