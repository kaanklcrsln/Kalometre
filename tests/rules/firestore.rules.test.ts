// Firestore güvenlik kuralı testleri. Emülatörde çalışır: npm run test:rules

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import {
  collection,
  collectionGroup,
  documentId,
  endAt,
  orderBy,
  query,
  startAt,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const EMAIL_DOMAIN = "users.kalometre.firebaseapp.com";
let env: RulesTestEnvironment;

const profile = (over: Record<string, unknown> = {}) => ({
  username: "kaan",
  name: "Kaan",
  sex: "male",
  birthYear: 1996,
  heightCm: 180,
  sports: [{ sportId: "running", daysPerWeek: 3 }],
  ...over,
});

const goal = (over: Record<string, unknown> = {}) => ({
  startWeightKg: 92,
  startDate: "2026-09-26",
  targetWeightKg: 80,
  paceKgPerMonth: 4,
  targetDate: "2099-01-01",
  dailyCalories: 1500,
  mealCalories: { breakfast: 450, lunch: 600, dinner: 450 },
  lockedUntil: "2099-01-01",
  ...over,
});

const UNLOCKED = { startDate: "2020-01-01", targetDate: "2020-01-10", lockedUntil: "2020-01-10" };

const entry = (over: Record<string, unknown> = {}) => ({
  category: "food",
  meal: "breakfast",
  rawText: "2 simit",
  items: [{ name: "Simit", amount: "2 adet", grams: 200, kcal: 550 }],
  totalKcal: 550,
  aiKcal: 550,
  editedByUser: false,
  createdAt: serverTimestamp(),
  ...over,
});

/** Giriş yapmış kullanıcının Firestore'u (e-posta = kullanıcı adı + sabit alan adı). */
const as = (uid: string, username = uid) =>
  env.authenticatedContext(uid, { email: `${username}@${EMAIL_DOMAIN}` }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

/** Kuralları atlayarak hazır veri yazar. */
async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

async function seedUser(uid: string, goalOver: Record<string, unknown> = {}) {
  await seed(`users/${uid}`, { profile: profile({ username: uid }), goal: goal(goalOver), createdAt: Timestamp.now() });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    // Geliştirme verisiyle (demo-kalometre) karışmasın: testler başta veritabanını temizler.
    projectId: "demo-kalometre-rules",
    firestore: { rules: readFileSync(process.env.RULES_FILE ?? "firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env?.cleanup();
});

// ---------------------------------------------------------------------------

describe("erişim izolasyonu", () => {
  it("kullanıcı kendi dokümanını okur", async () => {
    await seedUser("kaan");
    await assertSucceeds(getDoc(doc(as("kaan"), "users/kaan")));
  });

  it("başka kullanıcının dokümanını ve alt koleksiyonlarını okuyamaz", async () => {
    await seedUser("kaan");
    await seed("users/kaan/weights/2026-09-26", { weightKg: 92, createdAt: Timestamp.now() });
    await assertFails(getDoc(doc(as("ali"), "users/kaan")));
    await assertFails(getDoc(doc(as("ali"), "users/kaan/weights/2026-09-26")));
    await assertFails(getDocs(collection(as("ali"), "users/kaan/weights")));
  });

  it("giriş yapmamış kullanıcı hiçbir şey okuyamaz/yazamaz", async () => {
    await seedUser("kaan");
    await assertFails(getDoc(doc(anon(), "users/kaan")));
    await assertFails(setDoc(doc(anon(), "users/x"), { profile: profile(), goal: goal(), createdAt: serverTimestamp() }));
  });

  it("tüm kullanıcılar listelenemez", async () => {
    await assertFails(getDocs(collection(as("kaan"), "users")));
  });

  it("tanımsız koleksiyonlar kapalı", async () => {
    await assertFails(setDoc(doc(as("kaan"), "secrets/x"), { a: 1 }));
    await assertFails(getDoc(doc(as("kaan"), "secrets/x")));
  });
});

describe("users/{uid} oluşturma", () => {
  const create = (uid: string, data: Record<string, unknown>, username = uid) =>
    setDoc(doc(as(uid, username), `users/${uid}`), data);
  const valid = (over: Record<string, unknown> = {}) => ({
    profile: profile({ username: "kaan" }),
    goal: goal(),
    createdAt: serverTimestamp(),
    ...over,
  });

  it("geçerli onboarding kaydı kabul edilir", async () => {
    await assertSucceeds(create("kaan", valid()));
  });

  it("başkasının uid'ine yazılamaz", async () => {
    await assertFails(setDoc(doc(as("ali"), "users/kaan"), valid()));
  });

  it("profildeki kullanıcı adı hesabın kullanıcı adı olmalı", async () => {
    await assertFails(create("kaan", valid({ profile: profile({ username: "admin" }) })));
  });

  it("izin verilmeyen alan reddedilir", async () => {
    await assertFails(create("kaan", valid({ isAdmin: true })));
    await assertFails(create("kaan", valid({ profile: { ...profile(), role: "admin" } })));
    await assertFails(create("kaan", valid({ goal: { ...goal(), bonus: 1 } })));
  });

  it("createdAt sunucu zamanı olmalı", async () => {
    await assertFails(create("kaan", valid({ createdAt: Timestamp.fromDate(new Date(2000, 0, 1)) })));
  });

  it("sağlık tabanı: erkek 1500, kadın 1200 kcal altı reddedilir", async () => {
    await assertFails(
      create("kaan", valid({ goal: goal({ dailyCalories: 1400, mealCalories: { breakfast: 400, lunch: 600, dinner: 400 } }) })),
    );
    await assertSucceeds(
      create(
        "kaan",
        valid({
          profile: profile({ sex: "female" }),
          goal: goal({ dailyCalories: 1200, mealCalories: { breakfast: 400, lunch: 400, dinner: 400 } }),
        }),
      ),
    );
  });

  it("öğün 0 olabilir, eksi olamaz", async () => {
    await assertSucceeds(create("kaan", valid({ goal: goal({ mealCalories: { breakfast: 0, lunch: 900, dinner: 600 } }) })));
    await assertFails(create("kaan", valid({ goal: goal({ mealCalories: { breakfast: -50, lunch: 950, dinner: 600 } }) })));
  });

  it("öğün toplamı günlük kaloriye eşit olmalı", async () => {
    await assertFails(create("kaan", valid({ goal: goal({ mealCalories: { breakfast: 500, lunch: 600, dinner: 450 } }) })));
  });

  it("geçersiz değerler reddedilir", async () => {
    await assertFails(create("kaan", valid({ profile: profile({ heightCm: 400 }) })));
    await assertFails(create("kaan", valid({ profile: profile({ sex: "other" }) })));
    await assertFails(create("kaan", valid({ profile: profile({ name: "" }) })));
    await assertFails(create("kaan", valid({ profile: profile({ bodyFatPct: 90 }) })));
    await assertFails(create("kaan", valid({ profile: profile({ sports: [{ sportId: "running", daysPerWeek: 9 }] }) })));
    await assertFails(create("kaan", valid({ goal: goal({ paceKgPerMonth: 20 }) })));
    await assertFails(create("kaan", valid({ goal: goal({ paceKgPerMonth: -1 }) })));
    await assertFails(create("kaan", valid({ goal: goal({ targetWeightKg: 100 }) })));
    await assertFails(create("kaan", valid({ goal: goal({ startDate: "26.09.2026" }) })));
  });
});

describe("users/{uid} güncelleme ve kilit", () => {
  it("kilitliyken isim değişebilir", async () => {
    await seedUser("kaan");
    await assertSucceeds(updateDoc(doc(as("kaan"), "users/kaan"), { profile: profile({ name: "Kaan K" }) }));
  });

  it("kilitliyken günlük kalori, öğünler ve hedef tarihi değişebilir", async () => {
    await seedUser("kaan");
    await assertSucceeds(
      updateDoc(doc(as("kaan"), "users/kaan"), {
        goal: goal({ dailyCalories: 2000, mealCalories: { breakfast: 0, lunch: 1200, dinner: 800 }, targetDate: "2027-03-01" }),
      }),
    );
  });

  it("kilitliyken hedef kilo, başlangıç ve kilit tarihi değişemez", async () => {
    await seedUser("kaan");
    const ref = doc(as("kaan"), "users/kaan");
    await assertFails(updateDoc(ref, { goal: goal({ targetWeightKg: 60 }) }));
    await assertFails(updateDoc(ref, { goal: goal({ startWeightKg: 95 }) }));
    await assertFails(updateDoc(ref, { goal: goal({ lockedUntil: "2026-09-27" }) }));
    await assertFails(updateDoc(ref, { goal: goal({ startDate: "2026-09-27" }) }));
  });

  it("kilitliyken de günlük kalori tabanın altına inemez", async () => {
    await seedUser("kaan");
    await assertFails(
      updateDoc(doc(as("kaan"), "users/kaan"), { goal: goal({ dailyCalories: 1000, mealCalories: { breakfast: 0, lunch: 500, dinner: 500 } }) }),
    );
  });

  it("kilitliyken profilin diğer alanları değişemez", async () => {
    await seedUser("kaan");
    await assertFails(updateDoc(doc(as("kaan"), "users/kaan"), { profile: profile({ heightCm: 170 }) }));
  });

  it("kilit bitince yeni plan yazılabilir", async () => {
    await seedUser("kaan", UNLOCKED);
    await assertSucceeds(
      updateDoc(doc(as("kaan"), "users/kaan"), {
        profile: profile({ heightCm: 181 }),
        goal: goal({ startDate: "2026-09-26", targetWeightKg: 75 }),
      }),
    );
  });

  it("createdAt değiştirilemez", async () => {
    await seedUser("kaan");
    await assertFails(updateDoc(doc(as("kaan"), "users/kaan"), { createdAt: serverTimestamp() }));
  });

  it("kullanıcı dokümanı silinemez", async () => {
    await seedUser("kaan");
    await assertFails(deleteDoc(doc(as("kaan"), "users/kaan")));
  });
});

describe("weights", () => {
  const w = (weightKg: unknown, over: Record<string, unknown> = {}) => ({ weightKg, createdAt: serverTimestamp(), ...over });

  it("geçerli kilo yazılır, aynı gün üzerine yazılır, silinir", async () => {
    const db = as("kaan");
    await assertSucceeds(setDoc(doc(db, "users/kaan/weights/2026-09-26"), w(92.4)));
    await assertSucceeds(setDoc(doc(db, "users/kaan/weights/2026-09-26"), w(91.8)));
    await assertSucceeds(deleteDoc(doc(db, "users/kaan/weights/2026-09-26")));
  });

  it("aralık dışı kilo, yanlış tarih kimliği ve fazla alan reddedilir", async () => {
    const db = as("kaan");
    await assertFails(setDoc(doc(db, "users/kaan/weights/2026-09-26"), w(500)));
    await assertFails(setDoc(doc(db, "users/kaan/weights/2026-09-26"), w("92")));
    await assertFails(setDoc(doc(db, "users/kaan/weights/bugun"), w(92)));
    await assertFails(setDoc(doc(db, "users/kaan/weights/2026-13-01"), w(92)));
    await assertFails(setDoc(doc(db, "users/kaan/weights/2026-09-26"), w(92, { note: "x" })));
  });

  it("başkasının kilosuna yazılamaz", async () => {
    await assertFails(setDoc(doc(as("ali"), "users/kaan/weights/2026-09-26"), w(92)));
  });
});

describe("days: su ve AI sayacı", () => {
  const day = "users/kaan/days/2026-09-26";

  it("su eklenir ve azaltılır", async () => {
    const db = as("kaan");
    await assertSucceeds(setDoc(doc(db, day), { waterMl: increment(250) }, { merge: true }));
    await assertSucceeds(setDoc(doc(db, day), { waterMl: 0 }, { merge: true }));
  });

  it("negatif ya da aşırı su reddedilir", async () => {
    const db = as("kaan");
    await assertFails(setDoc(doc(db, day), { waterMl: -250 }));
    await assertFails(setDoc(doc(db, day), { waterMl: 999999 }));
  });

  it("AI sayacı yalnızca 1'er artar", async () => {
    const db = as("kaan");
    await assertSucceeds(setDoc(doc(db, day), { aiRequests: 1 }, { merge: true }));
    await assertSucceeds(setDoc(doc(db, day), { aiRequests: 2 }, { merge: true }));
    await assertFails(setDoc(doc(db, day), { aiRequests: 5 }, { merge: true }));
  });

  it("AI sayacı azaltılamaz, sıfırlanamaz, yüksek başlatılamaz", async () => {
    await seed(day, { aiRequests: 30 });
    const db = as("kaan");
    await assertFails(setDoc(doc(db, day), { aiRequests: 0 }, { merge: true }));
    await assertFails(setDoc(doc(db, day), { waterMl: 0 }));
    await assertFails(setDoc(doc(as("kaan"), "users/kaan/days/2026-09-27"), { aiRequests: 40 }));
  });

  it("AI sayacı 50'yi geçemez", async () => {
    await seed(day, { aiRequests: 50 });
    await assertFails(setDoc(doc(as("kaan"), day), { aiRequests: 51 }, { merge: true }));
  });

  it("gün dokümanı silinemez (sayaç sıfırlanmasın)", async () => {
    await seed(day, { aiRequests: 10, waterMl: 500 });
    await assertFails(deleteDoc(doc(as("kaan"), day)));
  });
});

describe("entries", () => {
  const col = "users/kaan/days/2026-09-26/entries";

  it("geçerli kayıt eklenir, düzenlenir, silinir", async () => {
    const db = as("kaan");
    await assertSucceeds(setDoc(doc(db, `${col}/e1`), entry()));
    await assertSucceeds(
      updateDoc(doc(db, `${col}/e1`), {
        meal: "dinner",
        items: [{ name: "Simit", amount: "2 adet", grams: 200, kcal: 600 }],
        totalKcal: 600,
        editedByUser: true,
      }),
    );
    await assertSucceeds(deleteDoc(doc(db, `${col}/e1`)));
  });

  it("geçersiz kayıtlar reddedilir", async () => {
    const db = as("kaan");
    await assertFails(setDoc(doc(db, `${col}/e1`), entry({ extra: 1 })));
    await assertFails(setDoc(doc(db, `${col}/e1`), entry({ category: "pizza" })));
    await assertFails(setDoc(doc(db, `${col}/e1`), entry({ items: [] })));
    await assertFails(setDoc(doc(db, `${col}/e1`), entry({ items: [{ name: "X", amount: "", grams: 0, kcal: 6000 }] })));
    await assertFails(setDoc(doc(db, `${col}/e1`), entry({ items: [{ name: "X", amount: "", grams: 0, kcal: 10, hack: 1 }] })));
    await assertFails(
      setDoc(doc(db, `${col}/e1`), entry({ items: Array.from({ length: 21 }, () => ({ name: "X", amount: "", grams: 1, kcal: 1 })) })),
    );
    await assertFails(setDoc(doc(db, `${col}/e1`), entry({ rawText: "x".repeat(501) })));
    await assertFails(setDoc(doc(db, `${col}/e1`), entry({ createdAt: Timestamp.now() })));
  });

  it("ham metin ve kategori sonradan değiştirilemez", async () => {
    const db = as("kaan");
    await assertSucceeds(setDoc(doc(db, `${col}/e1`), entry()));
    await assertFails(updateDoc(doc(db, `${col}/e1`), { rawText: "değişti" }));
    await assertFails(updateDoc(doc(db, `${col}/e1`), { category: "snack" }));
    await assertFails(updateDoc(doc(db, `${col}/e1`), { createdAt: serverTimestamp() }));
  });

  it("başkasının kayıtlarına erişilemez", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), `${col}/e1`), entry()));
    await assertFails(getDoc(doc(as("ali"), `${col}/e1`)));
    await assertFails(setDoc(doc(as("ali"), `${col}/e2`), entry()));
    await assertFails(deleteDoc(doc(as("ali"), `${col}/e1`)));
  });
});

describe("entitlements (Kalo+ üyeliği)", () => {
  const active = { plan: "kalo_plus", status: "active", expiresAtMs: Date.now() + 86_400_000, source: "google_play" };

  it("kullanıcı kendi üyeliğini okur", async () => {
    await seed("entitlements/kaan", active);
    await assertSucceeds(getDoc(doc(as("kaan"), "entitlements/kaan")));
  });

  it("başkasının üyeliği okunamaz, girişsiz okunamaz", async () => {
    await seed("entitlements/kaan", active);
    await assertFails(getDoc(doc(as("ali"), "entitlements/kaan")));
    await assertFails(getDoc(doc(anon(), "entitlements/kaan")));
  });

  it("kullanıcı kendine üyelik veremez, uzatamaz, silemez", async () => {
    await assertFails(setDoc(doc(as("kaan"), "entitlements/kaan"), active));
    await seed("entitlements/kaan", { ...active, expiresAtMs: Date.now() - 1 });
    await assertFails(updateDoc(doc(as("kaan"), "entitlements/kaan"), { expiresAtMs: Date.now() + 999_999_999 }));
    await assertFails(deleteDoc(doc(as("kaan"), "entitlements/kaan")));
  });

  it("üyelik kullanıcı dokümanına da gizlice eklenemez", async () => {
    await seedUser("kaan");
    await assertFails(updateDoc(doc(as("kaan"), "users/kaan"), { kaloPlus: true }));
  });
});

// ---------------------------------------------------------------------------
// Admin onayı ile Kalo+

/** Admin özel yetkisine (custom claim) sahip kullanıcı. */
const asAdmin = (uid = "boss") =>
  env.authenticatedContext(uid, { email: `${uid}@${EMAIL_DOMAIN}`, admin: true }).firestore();

const request = (over: Record<string, unknown> = {}) => ({
  username: "kaan",
  name: "Kaan",
  status: "pending",
  createdAt: serverTimestamp(),
  ...over,
});

const grant = (over: Record<string, unknown> = {}) => ({
  plan: "kalo_plus",
  status: "active",
  expiresAtMs: Date.now() + 30 * 86_400_000,
  source: "admin",
  grantedBy: "boss",
  grantedAt: serverTimestamp(),
  ...over,
});

describe("unlockRequests (onay isteği)", () => {
  it("kullanıcı kendi adına bekleyen istek açar ve okur", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), "unlockRequests/kaan"), request()));
    await assertSucceeds(getDoc(doc(as("kaan"), "unlockRequests/kaan")));
  });

  it("kullanıcı isteğini onaylanmış olarak açamaz", async () => {
    await assertFails(setDoc(doc(as("kaan"), "unlockRequests/kaan"), request({ status: "approved" })));
  });

  it("başkasının adına ya da başka kullanıcı adıyla istek açılamaz", async () => {
    await assertFails(setDoc(doc(as("ali"), "unlockRequests/kaan"), request()));
    await assertFails(setDoc(doc(as("kaan"), "unlockRequests/kaan"), request({ username: "ali" })));
  });

  it("kullanıcı kendi isteğini onaylayamaz", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), "unlockRequests/kaan"), request()));
    await assertFails(
      updateDoc(doc(as("kaan"), "unlockRequests/kaan"), { status: "approved", decidedBy: "kaan", decidedAt: serverTimestamp() }),
    );
  });

  it("başkaları istekleri okuyamaz ve listeleyemez; admin listeler", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), "unlockRequests/kaan"), request()));
    await assertFails(getDoc(doc(as("ali"), "unlockRequests/kaan")));
    await assertFails(getDocs(collection(as("ali"), "unlockRequests")));
    await assertSucceeds(getDocs(collection(asAdmin(), "unlockRequests")));
  });

  it("admin bekleyen isteği onaylar ya da reddeder", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), "unlockRequests/kaan"), request()));
    await assertSucceeds(
      updateDoc(doc(asAdmin(), "unlockRequests/kaan"), { status: "approved", decidedBy: "boss", decidedAt: serverTimestamp() }),
    );
  });

  it("admin kararı başka admin adına yazamaz, ismi değiştiremez", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), "unlockRequests/kaan"), request()));
    await assertFails(
      updateDoc(doc(asAdmin(), "unlockRequests/kaan"), { status: "approved", decidedBy: "baskasi", decidedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(doc(asAdmin(), "unlockRequests/kaan"), { status: "approved", decidedBy: "boss", decidedAt: serverTimestamp(), name: "X" }),
    );
  });

  it("reddedilen isteği kullanıcı yeniden açabilir ama kararı silemez", async () => {
    await seed("unlockRequests/kaan", { ...request(), createdAt: Timestamp.now(), status: "rejected", decidedBy: "boss", decidedAt: Timestamp.now() });
    await assertSucceeds(updateDoc(doc(as("kaan"), "unlockRequests/kaan"), { status: "pending", createdAt: serverTimestamp() }));
  });

  it("admin olmayan kimse karar veremez", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), "unlockRequests/kaan"), request()));
    await assertFails(
      updateDoc(doc(as("ali"), "unlockRequests/kaan"), { status: "approved", decidedBy: "ali", decidedAt: serverTimestamp() }),
    );
  });
});

describe("entitlements: admin ile satın alımsız üyelik", () => {
  it("admin geçerli üyelik verir ve geri alır", async () => {
    await assertSucceeds(setDoc(doc(asAdmin(), "entitlements/kaan"), grant()));
    await assertSucceeds(getDoc(doc(asAdmin(), "entitlements/kaan")));
    await assertSucceeds(deleteDoc(doc(asAdmin(), "entitlements/kaan")));
  });

  it("admin bile geçersiz üyelik yazamaz (fazla alan, ~1 yıldan uzun süre, başkası adına)", async () => {
    await assertFails(setDoc(doc(asAdmin(), "entitlements/kaan"), grant({ extra: true })));
    await assertFails(setDoc(doc(asAdmin(), "entitlements/kaan"), grant({ expiresAtMs: Date.now() + 1000 * 86_400_000 })));
    await assertFails(setDoc(doc(asAdmin(), "entitlements/kaan"), grant({ grantedBy: "baskasi" })));
    await assertFails(setDoc(doc(asAdmin(), "entitlements/kaan"), grant({ source: "google_play" })));
  });

  it("admin yetkisi olmayan kullanıcı kendine admin kaynaklı üyelik yazamaz", async () => {
    await assertFails(setDoc(doc(as("kaan"), "entitlements/kaan"), grant({ grantedBy: "kaan" })));
  });

  it("admin yetkisi token'da false/eksikse admin sayılmaz", async () => {
    const fake = env.authenticatedContext("kaan", { email: `kaan@${EMAIL_DOMAIN}`, admin: false }).firestore();
    await assertFails(setDoc(doc(fake, "entitlements/kaan"), grant({ grantedBy: "kaan" })));
  });
});

// ---------------------------------------------------------------------------
// Şikayet ve öneri notları

const todayNoteId = (uid: string) => `${uid}_${Math.floor(Date.now() / 86_400_000)}`;
const note = (over: Record<string, unknown> = {}) => ({
  uid: "kaan",
  username: "kaan",
  name: "Kaan",
  type: "suggestion",
  text: "Karanlık tema harika olmuş.",
  createdAt: serverTimestamp(),
  ...over,
});

describe("notes (şikayet ve öneri)", () => {
  it("kullanıcı bugünün notunu yazar ve okur", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), `notes/${todayNoteId("kaan")}`), note()));
    await assertSucceeds(getDoc(doc(as("kaan"), `notes/${todayNoteId("kaan")}`)));
  });

  it("aynı gün ikinci not yazılamaz (üzerine yazma dahil)", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), `notes/${todayNoteId("kaan")}`), note()));
    await assertFails(setDoc(doc(as("kaan"), `notes/${todayNoteId("kaan")}`), note({ text: "İkinci not deneme" })));
    await assertFails(updateDoc(doc(as("kaan"), `notes/${todayNoteId("kaan")}`), { text: "değiştirdim" }));
  });

  it("başka gün kimliğiyle ya da rastgele kimlikle yazılamaz (sınır atlatılamaz)", async () => {
    const day = Math.floor(Date.now() / 86_400_000);
    await assertFails(setDoc(doc(as("kaan"), `notes/kaan_${day + 1}`), note()));
    await assertFails(setDoc(doc(as("kaan"), `notes/kaan_${day - 1}`), note()));
    await assertFails(setDoc(doc(as("kaan"), "notes/rastgele"), note()));
  });

  it("başkası adına yazılamaz", async () => {
    await assertFails(setDoc(doc(as("ali"), `notes/${todayNoteId("kaan")}`), note()));
    await assertFails(setDoc(doc(as("ali"), `notes/${todayNoteId("ali")}`), note({ username: "kaan" })));
    await assertFails(setDoc(doc(as("ali"), `notes/${todayNoteId("ali")}`), note({ uid: "kaan", username: "ali" })));
  });

  it("geçersiz içerik reddedilir", async () => {
    const id = `notes/${todayNoteId("kaan")}`;
    await assertFails(setDoc(doc(as("kaan"), id), note({ text: "x" })));
    await assertFails(setDoc(doc(as("kaan"), id), note({ text: "x".repeat(1001) })));
    await assertFails(setDoc(doc(as("kaan"), id), note({ type: "spam" })));
    await assertFails(setDoc(doc(as("kaan"), id), note({ extra: 1 })));
    await assertFails(setDoc(doc(as("kaan"), id), note({ createdAt: Timestamp.now() })));
  });

  it("başkasının notu okunamaz; notlar listelenemez; kullanıcı silemez", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), `notes/${todayNoteId("kaan")}`), note()));
    await assertFails(getDoc(doc(as("ali"), `notes/${todayNoteId("kaan")}`)));
    await assertFails(getDocs(collection(as("kaan"), "notes")));
    await assertFails(deleteDoc(doc(as("kaan"), `notes/${todayNoteId("kaan")}`)));
  });

  it("kullanıcı henüz yazmadığı bugünkü notunu sorgulayabilir (yoksa boş döner)", async () => {
    await assertSucceeds(getDoc(doc(as("kaan"), `notes/${todayNoteId("kaan")}`)));
  });

  it("admin tüm notları listeler ve silebilir", async () => {
    await assertSucceeds(setDoc(doc(as("kaan"), `notes/${todayNoteId("kaan")}`), note()));
    await assertSucceeds(getDocs(collection(asAdmin(), "notes")));
    await assertSucceeds(deleteDoc(doc(asAdmin(), `notes/${todayNoteId("kaan")}`)));
  });
});

// ---------------------------------------------------------------------------
// Admin: kullanıcı yönetimi (listeleme, kaldırma)

describe("admin kullanıcı yönetimi", () => {
  const entryPath = "users/kaan/days/2026-09-26/entries/e1";

  async function seedFullUser() {
    await seedUser("kaan");
    await seed("users/kaan/weights/2026-09-26", { weightKg: 92, createdAt: Timestamp.now() });
    await seed("users/kaan/days/2026-09-26", { waterMl: 400, aiRequests: 3 });
    await seed(entryPath, { ...entry(), createdAt: Timestamp.now() });
  }

  it("admin tüm kullanıcıları listeler ve okur; normal kullanıcı listeleyemez", async () => {
    await seedFullUser();
    await assertSucceeds(getDocs(collection(asAdmin(), "users")));
    await assertSucceeds(getDoc(doc(asAdmin(), "users/kaan")));
    await assertSucceeds(getDocs(collection(asAdmin(), "users/kaan/weights")));
    await assertSucceeds(getDocs(collection(asAdmin(), "users/kaan/days")));
    await assertFails(getDocs(collection(as("ali"), "users")));
  });

  it("admin bir kullanıcının tüm yemek kayıtlarını koleksiyon grubu sorgusuyla bulur", async () => {
    await seedFullUser();
    const q = query(collectionGroup(asAdmin(), "entries"), orderBy(documentId()), startAt("users/kaan"), endAt("users/kaan\uf8ff"));
    await assertSucceeds(getDocs(q));
    const qUser = query(collectionGroup(as("ali"), "entries"), orderBy(documentId()), startAt("users/kaan"), endAt("users/kaan\uf8ff"));
    await assertFails(getDocs(qUser));
  });

  it("admin kullanıcı verilerini siler; kullanıcı kendi profilini ve gün dokümanını silemez", async () => {
    await seedFullUser();
    await assertFails(deleteDoc(doc(as("kaan"), "users/kaan")));
    await assertFails(deleteDoc(doc(as("kaan"), "users/kaan/days/2026-09-26")));
    await assertSucceeds(deleteDoc(doc(asAdmin(), entryPath)));
    await assertSucceeds(deleteDoc(doc(asAdmin(), "users/kaan/weights/2026-09-26")));
    await assertSucceeds(deleteDoc(doc(asAdmin(), "users/kaan/days/2026-09-26")));
    await assertSucceeds(deleteDoc(doc(asAdmin(), "users/kaan")));
  });

  const disable = (over: Record<string, unknown> = {}) => ({ username: "kaan", disabledBy: "boss", disabledAt: serverTimestamp(), ...over });

  it("admin hesabı kilitler; kendini kilitleyemez; normal kullanıcı kimseyi kilitleyemez", async () => {
    await assertSucceeds(setDoc(doc(asAdmin(), "disabledUsers/kaan"), disable()));
    await assertFails(setDoc(doc(asAdmin(), "disabledUsers/boss"), disable({ username: "boss" })));
    await assertFails(setDoc(doc(as("ali"), "disabledUsers/kaan"), disable({ disabledBy: "ali" })));
    await assertFails(setDoc(doc(asAdmin(), "disabledUsers/ali"), disable({ username: "ali", disabledBy: "baskasi" })));
  });

  it("kilitlenen kullanıcı kilidini görür, kaldıramaz ve yeni profil açamaz", async () => {
    await seed("disabledUsers/kaan", { username: "kaan", disabledBy: "boss", disabledAt: Timestamp.now() });
    await assertSucceeds(getDoc(doc(as("kaan"), "disabledUsers/kaan")));
    await assertFails(deleteDoc(doc(as("kaan"), "disabledUsers/kaan")));
    await assertFails(
      setDoc(doc(as("kaan"), "users/kaan"), { profile: profile(), goal: goal(), createdAt: serverTimestamp() }),
    );
  });

  it("kilidi kaldırılan kullanıcı yeniden profil açabilir", async () => {
    await seed("disabledUsers/kaan", { username: "kaan", disabledBy: "boss", disabledAt: Timestamp.now() });
    await assertSucceeds(deleteDoc(doc(asAdmin(), "disabledUsers/kaan")));
    await assertSucceeds(
      setDoc(doc(as("kaan"), "users/kaan"), { profile: profile(), goal: goal(), createdAt: serverTimestamp() }),
    );
  });
});
