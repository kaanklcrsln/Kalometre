import type { Timestamp } from "firebase/firestore";

export type Sex = "male" | "female";

export type Meal = "breakfast" | "lunch" | "dinner";

export type EntryCategory = "food" | "drink" | "snack";

export interface SportEntry {
  sportId: string;
  daysPerWeek: number;
}

export interface Profile {
  username: string;
  name: string;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  /** Yalnızca kullanıcı kendisi girdiyse dolu. */
  bodyFatPct?: number;
  sports: SportEntry[];
}

export type MealCalories = Record<Meal, number>;

export interface Goal {
  startWeightKg: number;
  /** yyyy-mm-dd */
  startDate: string;
  targetWeightKg: number;
  /** Seçilen hız (kg/ay, güvenli değilse tabandaki en yüksek hız). Koruma planında 0. */
  paceKgPerMonth: number;
  /** yyyy-mm-dd */
  targetDate: string;
  dailyCalories: number;
  mealCalories: MealCalories;
  /** Bu tarihe kadar (hariç) hedef kilo değiştirilemez (yeni plan kurulamaz); kalori ve öğünler serbest. yyyy-mm-dd */
  lockedUntil: string;
}

export interface UserDoc {
  profile: Profile;
  goal: Goal | null;
  createdAt: Timestamp | null;
}

export interface WeightEntry {
  /** yyyy-mm-dd (doküman kimliği) */
  date: string;
  weightKg: number;
}

export interface DayDoc {
  waterMl: number;
  /** Günlük AI istek sayacı (istemci tarafı sınır). */
  aiRequests?: number;
}

export interface FoodItem {
  name: string;
  amount: string;
  grams: number;
  kcal: number;
}

export interface Entry {
  id: string;
  category: EntryCategory;
  meal: Meal;
  rawText: string;
  items: FoodItem[];
  totalKcal: number;
  /** Gemini'nin kalemlerinin kod tarafından hesaplanan toplamı; manuel girişte 0. */
  aiKcal: number;
  editedByUser: boolean;
  createdAt: Timestamp | null;
}

export type NewEntry = Omit<Entry, "id" | "createdAt">;

export interface AiAnalysis {
  items: FoodItem[];
  assumptions: string;
  isFood: boolean;
}

export interface ChatMessage {
  role: "user" | "model";
  /** Modele geçmiş olarak giden metin (fotoğraf mesajında kısa açıklama). */
  text: string;
  /** Yalnızca ekranda: kullanıcının gönderdiği yemek fotoğrafının küçültülmüş hâli (data URL, bellekte). */
  imageUrl?: string;
}

/** Sohbet yanıtı: kullanıcı yediği bir şeyi anlattıysa food/kcal dolu gelir. */
export interface ChatReply {
  text: string;
  food: { name: string; kcal: number } | null;
}
