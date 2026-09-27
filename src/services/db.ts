// Firestore erişimi. Tüm yollar users/{uid}/** altında.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { firestore } from "../config/firebase";
import { ADMIN_GRANT_DAYS, type EntitlementDoc, type UnlockRequest } from "../lib/entitlement";
import { todayNoteId, type Note, type NoteType } from "../lib/notes";
import type { DayDoc, Entry, Goal, NewEntry, Profile, UserDoc, WeightEntry } from "../types";

const userRef = (uid: string) => doc(firestore, "users", uid);
const weightsCol = (uid: string) => collection(firestore, "users", uid, "weights");
const dayRef = (uid: string, dateKey: string) => doc(firestore, "users", uid, "days", dateKey);
const entriesCol = (uid: string, dateKey: string) =>
  collection(firestore, "users", uid, "days", dateKey, "entries");

type Unsubscribe = () => void;
type OnError = (error: Error) => void;

// ---------- Kullanıcı ----------

/** Doküman yoksa `null` (onboarding tamamlanmamış). */
export function subscribeUser(
  uid: string,
  onData: (user: UserDoc | null) => void,
  onError?: OnError,
): Unsubscribe {
  return onSnapshot(
    userRef(uid),
    (snap) => onData(snap.exists() ? (snap.data() as UserDoc) : null),
    onError,
  );
}

/** Onboarding sonunda profil + hedef + ilk kilo kaydını tek seferde yazar. */
export async function completeOnboarding(
  uid: string,
  profile: Profile,
  goal: Goal,
  weightKg: number,
  dateKey: string,
): Promise<void> {
  const batch = writeBatch(firestore);
  batch.set(userRef(uid), { profile, goal, createdAt: serverTimestamp() });
  batch.set(doc(weightsCol(uid), dateKey), { weightKg, createdAt: serverTimestamp() });
  await batch.commit();
}

/** Profil ve/veya hedefi bütün olarak değiştirir (eski alanlar kalmaz). */
export async function updateUser(
  uid: string,
  data: { profile?: Profile; goal?: Goal },
): Promise<void> {
  const patch: DocumentData = {};
  if (data.profile) patch.profile = data.profile;
  if (data.goal) patch.goal = data.goal;
  await updateDoc(userRef(uid), patch);
}

// ---------- Kilo ----------

export function subscribeWeights(
  uid: string,
  onData: (weights: WeightEntry[]) => void,
  onError?: OnError,
): Unsubscribe {
  // Doküman kimliği yyyy-mm-dd olduğu için createdAt yerine kimliğe göre sıralanır.
  return onSnapshot(
    weightsCol(uid),
    (snap) =>
      onData(
        snap.docs
          .map((d) => ({ date: d.id, weightKg: d.data().weightKg as number }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      ),
    onError,
  );
}

/** Günde tek kayıt: aynı gün tekrar yazılırsa üzerine yazar. */
export async function setWeight(uid: string, dateKey: string, weightKg: number): Promise<void> {
  await setDoc(doc(weightsCol(uid), dateKey), { weightKg, createdAt: serverTimestamp() });
}

export async function deleteWeight(uid: string, dateKey: string): Promise<void> {
  await deleteDoc(doc(weightsCol(uid), dateKey));
}

// ---------- Gün / su ----------

export function subscribeDay(
  uid: string,
  dateKey: string,
  onData: (day: DayDoc) => void,
  onError?: OnError,
): Unsubscribe {
  return onSnapshot(
    dayRef(uid, dateKey),
    (snap) => {
      const data = snap.data();
      onData({ waterMl: data?.waterMl ?? 0, aiRequests: data?.aiRequests ?? 0 });
    },
    onError,
  );
}

/** Su ekler/çıkarır; toplam 0'ın altına inmez. */
export async function addWater(uid: string, dateKey: string, deltaMl: number): Promise<void> {
  if (deltaMl >= 0) {
    await setDoc(dayRef(uid, dateKey), { waterMl: increment(deltaMl) }, { merge: true });
    return;
  }
  await runTransaction(firestore, async (tx) => {
    const snap = await tx.get(dayRef(uid, dateKey));
    const current = (snap.data()?.waterMl as number | undefined) ?? 0;
    tx.set(dayRef(uid, dateKey), { waterMl: Math.max(0, current + deltaMl) }, { merge: true });
  });
}

/**
 * Günlük AI kotasından bir istek ayırır. Sınır dolduysa false döner.
 * Sayaç, isteğin yapıldığı günün (bugünün) days dokümanında tutulur.
 */
export async function reserveAiRequest(
  uid: string,
  dateKey: string,
  limit: number,
): Promise<boolean> {
  return runTransaction(firestore, async (tx) => {
    const snap = await tx.get(dayRef(uid, dateKey));
    const used = (snap.data()?.aiRequests as number | undefined) ?? 0;
    if (used >= limit) return false;
    tx.set(dayRef(uid, dateKey), { aiRequests: used + 1 }, { merge: true });
    return true;
  });
}

// ---------- Kayıtlar ----------

export function subscribeEntries(
  uid: string,
  dateKey: string,
  onData: (entries: Entry[]) => void,
  onError?: OnError,
): Unsubscribe {
  return onSnapshot(
    query(entriesCol(uid, dateKey), orderBy("createdAt", "asc")),
    (snap) =>
      onData(
        snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: "estimate" }) as Omit<Entry, "id">) })),
      ),
    onError,
  );
}

export async function addEntry(uid: string, dateKey: string, entry: NewEntry): Promise<void> {
  await addDoc(entriesCol(uid, dateKey), { ...entry, createdAt: serverTimestamp() });
}

export async function updateEntry(
  uid: string,
  dateKey: string,
  id: string,
  patch: Partial<NewEntry>,
): Promise<void> {
  await updateDoc(doc(entriesCol(uid, dateKey), id), patch);
}

export async function deleteEntry(uid: string, dateKey: string, id: string): Promise<void> {
  await deleteDoc(doc(entriesCol(uid, dateKey), id));
}

// ---------- Üyelik (yalnızca okunur; sunucu yazar) ----------

/** entitlements/{uid}: Kalo+ aboneliği. Doküman yoksa null. */
export function subscribeEntitlement(
  uid: string,
  onData: (doc: Partial<EntitlementDoc> | null) => void,
  onError?: OnError,
): Unsubscribe {
  return onSnapshot(
    doc(firestore, "entitlements", uid),
    (snap) => onData(snap.exists() ? (snap.data() as Partial<EntitlementDoc>) : null),
    onError,
  );
}

// ---------- Kilit açma istekleri (admin onayı) ----------

const requestRef = (uid: string) => doc(firestore, "unlockRequests", uid);

function toRequest(id: string, d: DocumentData): UnlockRequest {
  const ts = d.createdAt as { toMillis?: () => number } | null | undefined;
  return { uid: id, username: d.username, name: d.name, status: d.status, createdAtMs: ts?.toMillis?.() ?? null };
}

/** Kullanıcının kendi isteği; yoksa null. */
export function subscribeUnlockRequest(
  uid: string,
  onData: (req: UnlockRequest | null) => void,
  onError?: OnError,
): Unsubscribe {
  return onSnapshot(
    requestRef(uid),
    (snap) => onData(snap.exists() ? toRequest(snap.id, snap.data({ serverTimestamps: "estimate" })) : null),
    onError,
  );
}

/**
 * Admin onayı iste. İlk kez: yeni istek. Daha önce onaylanmış/reddedilmişse: yeniden "bekliyor".
 * (Kurallar, kullanıcının durumu "onaylandı" yapmasına izin vermez.)
 */
export async function requestUnlock(uid: string, username: string, name: string, existing: UnlockRequest | null): Promise<void> {
  if (!existing) {
    await setDoc(requestRef(uid), { username, name, status: "pending", createdAt: serverTimestamp() });
  } else {
    await updateDoc(requestRef(uid), { status: "pending", name, createdAt: serverTimestamp() });
  }
}

/** Admin: bekleyen istekler, eskiden yeniye. */
export function subscribePendingUnlockRequests(
  onData: (reqs: UnlockRequest[]) => void,
  onError?: OnError,
): Unsubscribe {
  return onSnapshot(
    query(collection(firestore, "unlockRequests"), where("status", "==", "pending")),
    (snap) =>
      onData(
        snap.docs
          .map((d) => toRequest(d.id, d.data({ serverTimestamps: "estimate" })))
          .sort((a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0)),
      ),
    onError,
  );
}

/** Admin: onayla → kullanıcıya ADMIN_GRANT_DAYS günlük Kalo+ ver ve isteği kapat (tek işlemde). */
export async function approveUnlock(adminUid: string, uid: string): Promise<void> {
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, "entitlements", uid), {
    plan: "kalo_plus",
    status: "active",
    expiresAtMs: Date.now() + ADMIN_GRANT_DAYS * 86_400_000,
    source: "admin",
    grantedBy: adminUid,
    grantedAt: serverTimestamp(),
  });
  batch.update(requestRef(uid), { status: "approved", decidedBy: adminUid, decidedAt: serverTimestamp() });
  await batch.commit();
}

/** Admin: reddet. */
export async function rejectUnlock(adminUid: string, uid: string): Promise<void> {
  await updateDoc(requestRef(uid), { status: "rejected", decidedBy: adminUid, decidedAt: serverTimestamp() });
}

// ---------- Şikayet ve öneri notları ----------

function toNote(id: string, d: DocumentData): Note {
  const ts = d.createdAt as { toMillis?: () => number } | null | undefined;
  return { id, uid: d.uid, username: d.username, name: d.name, type: d.type, text: d.text, createdAtMs: ts?.toMillis?.() ?? null };
}

/** Kullanıcının bugünkü notu (varsa). */
export function subscribeTodayNote(uid: string, onData: (note: Note | null) => void, onError?: OnError): Unsubscribe {
  const id = todayNoteId(uid, Date.now());
  return onSnapshot(
    doc(firestore, "notes", id),
    (snap) => onData(snap.exists() ? toNote(snap.id, snap.data({ serverTimestamps: "estimate" })) : null),
    onError,
  );
}

/** Bugünün notunu yazar. Aynı gün ikinci not kurallar tarafından reddedilir. */
export async function submitNote(uid: string, username: string, name: string, type: NoteType, text: string): Promise<void> {
  await setDoc(doc(firestore, "notes", todayNoteId(uid, Date.now())), {
    uid,
    username,
    name,
    type,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
}

/** Admin: en yeni notlar. */
export function subscribeLatestNotes(onData: (notes: Note[]) => void, onError?: OnError, max = 50): Unsubscribe {
  return onSnapshot(
    query(collection(firestore, "notes"), orderBy("createdAt", "desc"), limit(max)),
    (snap) => onData(snap.docs.map((d) => toNote(d.id, d.data({ serverTimestamps: "estimate" })))),
    onError,
  );
}

/** Admin: notu sil. */
export async function deleteNote(id: string): Promise<void> {
  await deleteDoc(doc(firestore, "notes", id));
}
