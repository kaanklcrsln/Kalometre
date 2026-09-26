// Firestore erişimi. Tüm yollar users/{uid}/** altında.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { firestore } from "../config/firebase";
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
