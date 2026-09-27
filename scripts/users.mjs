// Kullanıcı yönetimi (Admin SDK). Uygulama içinden yapılamayan işlemler: tüm hesapları listeleme,
// başkasının şifresini değiştirme, giriş hesabını tamamen silme.
//
// Kullanım (gerçek proje; önce: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\guvenli\kalometre-adminsdk.json"):
//   npm run users -- list
//   npm run users -- password <kullanıcıadı> <yeni-şifre>
//   npm run users -- delete <kullanıcıadı>
// Emülatör: sona --emulator ekle.
//
// Hizmet hesabı anahtarı projenin TAM yöneticisidir: proje klasörüne koyma, git'e ekleme, paylaşma.

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const EMAIL_DOMAIN = "users.kalometre.firebaseapp.com";
const args = process.argv.slice(2).filter((a) => a !== "--emulator");
const useEmulator = process.argv.includes("--emulator");
const [command, rawUsername, newPassword] = args;
const username = rawUsername?.trim().toLowerCase();

const usage = () => {
  console.error("Kullanım: npm run users -- list | password <kullanıcıadı> <yeni-şifre> | delete <kullanıcıadı>  [--emulator]");
  process.exit(1);
};
if (!["list", "password", "delete"].includes(command)) usage();
if (command !== "list" && (!username || !/^[a-z0-9._]{3,20}$/.test(username))) usage();

let projectId;
if (useEmulator) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  projectId = "demo-kalometre";
  initializeApp({ projectId });
} else {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error("GOOGLE_APPLICATION_CREDENTIALS ayarlı değil (bkz. README > Admin hesabı açmak).");
    process.exit(1);
  }
  projectId = JSON.parse(readFileSync(".firebaserc", "utf8")).projects.default;
  initializeApp({ credential: applicationDefault(), projectId });
}

const auth = getAuth();
const db = getFirestore();
const toUsername = (email) => (email?.endsWith(`@${EMAIL_DOMAIN}`) ? email.split("@")[0] : email ?? "?");

async function findUser() {
  try {
    return await auth.getUserByEmail(`${username}@${EMAIL_DOMAIN}`);
  } catch (err) {
    if (err?.code === "auth/user-not-found") {
      console.error(`@${username} bulunamadı.`);
      process.exit(1);
    }
    throw err;
  }
}

try {
  if (command === "list") {
    const all = [];
    let pageToken;
    do {
      const page = await auth.listUsers(1000, pageToken);
      all.push(...page.users);
      pageToken = page.pageToken;
    } while (pageToken);
    const disabled = new Set((await db.collection("disabledUsers").get()).docs.map((d) => d.id));
    const profiles = new Set((await db.collection("users").get()).docs.map((d) => d.id));
    console.log(`${all.length} giriş hesabı (proje ${projectId}${useEmulator ? ", emülatör" : ""}):`);
    for (const u of all.sort((a, b) => a.metadata.creationTime.localeCompare(b.metadata.creationTime))) {
      const flags = [
        u.customClaims?.admin ? "admin" : null,
        disabled.has(u.uid) ? "KALDIRILDI" : null,
        profiles.has(u.uid) ? null : "profil yok",
      ].filter(Boolean);
      console.log(`  @${toUsername(u.email)}  (kayıt ${new Date(u.metadata.creationTime).toLocaleDateString("tr-TR")})${flags.length ? "  [" + flags.join(", ") + "]" : ""}`);
    }
  }

  if (command === "password") {
    if (!newPassword || newPassword.length < 6) {
      console.error("Yeni şifre en az 6 karakter olmalı.");
      process.exit(1);
    }
    const user = await findUser();
    await auth.updateUser(user.uid, { password: newPassword });
    // Açık oturumlar kapansın; kullanıcı yeni şifreyle giriş yapsın.
    await auth.revokeRefreshTokens(user.uid);
    console.log(`@${username} için şifre değiştirildi ve açık oturumları kapatıldı. Yeni şifreyi kişiye güvenli bir yoldan ilet.`);
  }

  if (command === "delete") {
    const user = await findUser();
    if (user.customClaims?.admin) {
      console.error(`@${username} bir admin. Önce yetkisini kaldır: npm run admin -- ${username} --remove`);
      process.exit(1);
    }
    const uid = user.uid;
    // Alt koleksiyonlar (kilolar, günler, yemek kayıtları) dahil tüm kullanıcı verileri.
    await db.recursiveDelete(db.doc(`users/${uid}`));
    const notes = await db.collection("notes").where("uid", "==", uid).get();
    const batch = db.batch();
    notes.docs.forEach((d) => batch.delete(d.ref));
    for (const path of [`entitlements/${uid}`, `unlockRequests/${uid}`, `disabledUsers/${uid}`]) batch.delete(db.doc(path));
    await batch.commit();
    await auth.deleteUser(uid);
    console.log(`@${username} tamamen silindi (giriş hesabı + tüm veriler, ${notes.size} not).`);
  }
} catch (err) {
  console.error("İşlem başarısız:", err?.message ?? err);
  process.exit(1);
}
