// Tüm formüller: saf fonksiyonlar, yan etkisiz. Testler: calculations.test.ts

import { findSport, SESSION_HOURS } from "../config/sports";
import type { FoodItem, Goal, Meal, MealCalories, Profile, Sex, SportEntry } from "../types";
import { addDays, toDateKey } from "./dates";

export const KCAL_PER_KG = 7700;
export const DAYS_PER_MONTH = 30;
export const MIN_ADULT_AGE = 18;
export const MIN_HEALTHY_BMI = 18.5;
/** Günlük kalori hedefi sağlık için bu değerlerin altına inmez. */
export const MIN_DAILY_KCAL: Record<Sex, number> = { female: 1200, male: 1500 };
/** Spor dışı günlük hareket (masa başı yaşam) çarpanı. */
export const BASE_ACTIVITY_FACTOR = 1.2;
/** Mevcut ve hedef kilo arasındaki fark bundan küçükse "koru" planı. */
export const MAINTAIN_THRESHOLD_KG = 0.1;
/** Koruma ya da tarihsiz planda hedef kilonun sabit kaldığı süre (gün). */
export const MAINTAIN_LOCK_DAYS = 30;
export const MEAL_STEP_KCAL = 50;
/** Öğün 0 olabilir (ör. kahvaltı yapmayan kullanıcı). */
export const MIN_MEAL_KCAL = 0;
export const CALORIE_STEP_KCAL = 50;
export const MAX_DAILY_KCAL = 6000;
/** Hedefe bundan uzun sürecekse bu kaloriyle "ulaşılamaz" sayılır. */
export const MAX_GOAL_DAYS = 3 * 365;

export const PACES = [
  { key: "relaxed", label: "Acelem yok", kgPerMonth: 3 },
  { key: "normal", label: "Olması gerektiği gibi", kgPerMonth: 4 },
  { key: "fast", label: "Acelem var", kgPerMonth: 6 },
] as const;
export const DEFAULT_PACE_KG_PER_MONTH = 4;

// ---------- Yaş ----------

export function ageFromBirthYear(birthYear: number, today: Date): number {
  return today.getFullYear() - birthYear;
}

export function birthYearFromAge(age: number, today: Date): number {
  return today.getFullYear() - age;
}

// ---------- VKİ ----------

export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

export const BMI_CATEGORY_LABELS: Record<BmiCategory, string> = {
  underweight: "Zayıf",
  normal: "Normal",
  overweight: "Fazla kilolu",
  obese: "Obez",
};

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return "underweight";
  if (value < 25) return "normal";
  if (value < 30) return "overweight";
  return "obese";
}

export function weightForBmi(targetBmi: number, heightCm: number): number {
  const m = heightCm / 100;
  return targetBmi * m * m;
}

// ---------- Bazal metabolizma ----------

export function bmrMifflinStJeor(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function bmrKatchMcArdle(weightKg: number, bodyFatPct: number): number {
  const leanMassKg = weightKg * (1 - bodyFatPct / 100);
  return 370 + 21.6 * leanMassKg;
}

export type BmrFormula = "katch-mcardle" | "mifflin-st-jeor";

export function bmr(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  bodyFatPct?: number;
}): { value: number; formula: BmrFormula } {
  if (input.bodyFatPct !== undefined) {
    return { value: bmrKatchMcArdle(input.weightKg, input.bodyFatPct), formula: "katch-mcardle" };
  }
  return {
    value: bmrMifflinStJeor(input.weightKg, input.heightCm, input.age, input.sex),
    formula: "mifflin-st-jeor",
  };
}

// ---------- Spor ----------

/**
 * Sporların günlük ortalama ek harcaması (kcal/gün).
 * (MET − 1) × kg × saat: dinlenme harcaması zaten bazalda sayıldığı için 1 MET düşülür.
 */
export function sportKcalPerDay(sports: SportEntry[], weightKg: number): number {
  const weekly = sports.reduce((sum, s) => {
    const met = findSport(s.sportId)?.met ?? 0;
    const days = Math.min(Math.max(s.daysPerWeek, 0), 7);
    return sum + Math.max(met - 1, 0) * weightKg * SESSION_HOURS * days;
  }, 0);
  return weekly / 7;
}

/** Tahmini toplam günlük harcama: bazal × 1.2 + spor. */
export function dailyBurn(bmrValue: number, sportKcal: number): number {
  return bmrValue * BASE_ACTIVITY_FACTOR + sportKcal;
}

// ---------- Hız ----------

export function dailyDeficitForPace(kgPerMonth: number): number {
  return (kgPerMonth * KCAL_PER_KG) / DAYS_PER_MONTH;
}

export function paceForDailyDeficit(deficit: number): number {
  return (deficit * DAYS_PER_MONTH) / KCAL_PER_KG;
}

export function daysToGoal(currentKg: number, targetKg: number, kgPerMonth: number): number {
  const diff = currentKg - targetKg;
  if (diff <= 0) return 0;
  if (kgPerMonth <= 0) return Infinity;
  return Math.ceil((diff / kgPerMonth) * DAYS_PER_MONTH);
}

// ---------- Doğrulama ----------

/** Hedef kabul edilemezse kullanıcıya gösterilecek mesaj. */
export function validateGoal(input: {
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
}): string | null {
  const { age, heightCm, currentWeightKg, targetWeightKg } = input;
  if (!(targetWeightKg > 0)) return "Geçerli bir hedef kilo gir.";
  if (targetWeightKg > currentWeightKg + MAINTAIN_THRESHOLD_KG) {
    return "Şimdilik yalnızca kilo verme veya koruma planı oluşturabiliyoruz. Hedefin şu anki kilona eşit ya da daha düşük olmalı.";
  }
  const isLoss = targetWeightKg < currentWeightKg - MAINTAIN_THRESHOLD_KG;
  if (isLoss && age < MIN_ADULT_AGE) {
    return "18 yaşından küçükler için kilo verme planı oluşturmuyoruz. Lütfen bir doktor veya diyetisyene danış.";
  }
  if (isLoss && bmi(targetWeightKg, heightCm) < MIN_HEALTHY_BMI) {
    const minKg = Math.ceil(weightForBmi(MIN_HEALTHY_BMI, heightCm) * 10) / 10;
    return `Bu hedef sağlıklı aralığın altında. Boyun için en az ${minKg} kg hedefleyebilirsin.`;
  }
  return null;
}

/// ---------- Plan ----------
//
// Tek model: günlük harcama = bazal × 1,2 + spor. Kullanıcı hangi kaloriyi seçerse seçsin
// açık = harcama − kalori ve hedef tarihi = kalan kilo × 7700 / açık. Hız butonları yalnızca bir kalori
// ÖNERİR (harcama − hızın açığı); kullanıcı günlük kaloriyi sonradan istediği gibi değiştirebilir.

export interface PlanInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  sports: SportEntry[];
  targetWeightKg: number;
  paceKgPerMonth: number;
  /** Kullanıcının seçtiği günlük kalori; verilmezse seçilen hızın önerisi kullanılır. */
  dailyCalories?: number;
  today: Date;
}

export interface Plan {
  bmi: number;
  bmiCategory: BmiCategory;
  bmr: number;
  bmrFormula: BmrFormula;
  sportKcalPerDay: number;
  /** Spor dahil tahmini günlük harcama. */
  dailyBurn: number;
  /** Seçilebilecek en düşük günlük kalori: sağlık tabanı (18 yaş altında harcamanın kendisi). */
  minCalories: number;
  direction: "lose" | "maintain";
  /** Etkin hedef (koruma planında mevcut kilo). */
  targetWeightKg: number;
  /** Seçilen hız (koruma: 0). */
  paceKgPerMonth: number;
  /** Sağlık tabanına kadar inerek ulaşılabilecek en yüksek hız (kg/ay). */
  maxSafeKgPerMonth: number;
  /** Seçilen hızın önerdiği günlük kalori. */
  suggestedCalories: number;
  /** Uygulanan günlük kalori (kullanıcı seçimi ya da öneri, sınırlar içinde). */
  dailyCalories: number;
  /** Harcama − günlük kalori (negatifse fazla). */
  dailyDeficit: number;
  /** Bu açıkla ayda verilen kilo (açık yoksa 0). */
  monthlyKg: number;
  /** Bu kaloriyle hedefe makul sürede ulaşılır mı? (koruma planında her zaman true) */
  reachable: boolean;
  days: number;
  /** yyyy-mm-dd */
  targetDate: string;
  notices: string[];
}

export interface PaceChoice {
  key: string;
  label: string;
  kgPerMonth: number;
  /** Sağlık tabanının altına inmeden bu hıza ulaşılabilir mi? */
  safe: boolean;
  suggestedCalories: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function buildPlan(input: PlanInput): Plan {
  const { sex, age, heightCm, weightKg, bodyFatPct, sports, today } = input;
  const notices: string[] = [];

  const bmiValue = bmi(weightKg, heightCm);
  const bmrResult = bmr({ weightKg, heightCm, age, sex, bodyFatPct });
  const sportKcal = sportKcalPerDay(sports, weightKg);
  const burn = dailyBurn(bmrResult.value, sportKcal);
  const floor = MIN_DAILY_KCAL[sex];
  const isMinor = age < MIN_ADULT_AGE;

  let direction: Plan["direction"] = weightKg - input.targetWeightKg > MAINTAIN_THRESHOLD_KG ? "lose" : "maintain";
  if (direction === "lose" && isMinor) {
    notices.push("18 yaşından küçükler için kilo verme planı oluşturulmaz; kilonu koruma kalorisi gösteriliyor.");
    direction = "maintain";
  }
  // Sağlık tabanında bile açık yoksa ya da hedef 3 yıldan uzun sürecekse kilo verme planı kurulamaz.
  const floorDeficit = burn - floor;
  if (direction === "lose" && (floorDeficit <= 0 || ((weightKg - input.targetWeightKg) * KCAL_PER_KG) / floorDeficit > MAX_GOAL_DAYS)) {
    notices.push(
      `Sağlığın için günlük kalorin ${floor} kcal'nin altına inemez ve şu anki hareketinle bu kalori yeterli açık oluşturmuyor. Kilonu koruma kalorisi gösteriliyor; spor ekleyerek kilo vermeye başlayabilirsin.`,
    );
    direction = "maintain";
  }
  const targetWeightKg = direction === "maintain" ? weightKg : input.targetWeightKg;

  // 18 yaş altında açık oluşturulmaz: en düşük kalori harcamanın kendisi.
  const minCalories = isMinor ? Math.max(floor, Math.round(burn)) : floor;
  const maxSafeKgPerMonth = Math.max(0, paceForDailyDeficit(burn - floor));
  const paceKgPerMonth = direction === "lose" ? input.paceKgPerMonth : 0;
  const suggestedCalories =
    direction === "lose"
      ? Math.max(floor, Math.round(burn - dailyDeficitForPace(paceKgPerMonth)))
      : Math.max(minCalories, Math.round(burn));

  const chosen = input.dailyCalories ?? suggestedCalories;
  const dailyCalories = Math.min(Math.max(Math.round(chosen), minCalories), MAX_DAILY_KCAL);
  const dailyDeficit = Math.round(burn - dailyCalories);
  const monthlyKg = dailyDeficit > 0 ? paceForDailyDeficit(dailyDeficit) : 0;

  let days = 0;
  let reachable = true;
  if (direction === "lose") {
    days = dailyDeficit > 0 ? Math.ceil(((weightKg - targetWeightKg) * KCAL_PER_KG) / dailyDeficit) : Infinity;
    reachable = days <= MAX_GOAL_DAYS;
    if (!reachable) {
      notices.push(
        dailyDeficit > 0
          ? "Bu kaloriyle hedefe ulaşmak 3 yıldan uzun sürer. Kaloriyi biraz düşür ya da spor ekle."
          : "Bu kalori günlük harcamana eşit ya da fazla; bununla kilo vermezsin. Kaloriyi düşür ya da spor ekle.",
      );
      days = 0;
    }
  }

  return {
    bmi: round1(bmiValue),
    bmiCategory: bmiCategory(bmiValue),
    bmr: Math.round(bmrResult.value),
    bmrFormula: bmrResult.formula,
    sportKcalPerDay: Math.round(sportKcal),
    dailyBurn: Math.round(burn),
    minCalories,
    direction,
    targetWeightKg,
    paceKgPerMonth,
    maxSafeKgPerMonth: round1(maxSafeKgPerMonth),
    suggestedCalories,
    dailyCalories,
    dailyDeficit,
    monthlyKg: round1(monthlyKg),
    reachable,
    days,
    targetDate: toDateKey(addDays(today, days)),
    notices,
  };
}

/** Hız butonları: her hızın önerdiği kalori ve sağlık tabanına göre güvenli olup olmadığı. */
export function paceChoices(plan: Pick<Plan, "dailyBurn" | "maxSafeKgPerMonth">, sex: Sex): PaceChoice[] {
  const floor = MIN_DAILY_KCAL[sex];
  return PACES.map((p) => ({
    key: p.key,
    label: p.label,
    kgPerMonth: p.kgPerMonth,
    safe: p.kgPerMonth <= plan.maxSafeKgPerMonth,
    suggestedCalories: Math.max(floor, Math.round(plan.dailyBurn - dailyDeficitForPace(p.kgPerMonth))),
  }));
}

/** Güvenli seçeneklerden istenene en yakın hız (hiçbiri güvenli değilse en yavaşı). */
export function safePace(requested: number, choices: PaceChoice[]): number {
  const safe = choices.filter((c) => c.safe && c.kgPerMonth <= requested);
  return safe.length > 0 ? safe[safe.length - 1].kgPerMonth : choices[0].kgPerMonth;
}

type PlanProfile = Pick<Profile, "sex" | "birthYear" | "heightCm" | "bodyFatPct" | "sports">;

export function planForProfile(
  profile: PlanProfile,
  weightKg: number,
  targetWeightKg: number,
  paceKgPerMonth: number,
  today: Date,
  dailyCalories?: number,
): Plan {
  return buildPlan({
    sex: profile.sex,
    age: ageFromBirthYear(profile.birthYear, today),
    heightCm: profile.heightCm,
    weightKg,
    bodyFatPct: profile.bodyFatPct,
    sports: profile.sports,
    targetWeightKg,
    paceKgPerMonth,
    dailyCalories,
    today,
  });
}

/** Planın bir hedef tarihi var mı? (kilo verme ve makul sürede ulaşılabilir) */
export function planHasDate(plan: Plan): boolean {
  return plan.direction === "lose" && plan.reachable && plan.days > 0;
}

export function goalFromPlan(plan: Plan, startWeightKg: number, mealCalories: MealCalories, today: Date): Goal {
  const todayKey = toDateKey(today);
  return {
    startWeightKg,
    startDate: todayKey,
    targetWeightKg: plan.targetWeightKg,
    paceKgPerMonth: plan.paceKgPerMonth,
    targetDate: planHasDate(plan) ? plan.targetDate : todayKey,
    dailyCalories: plan.dailyCalories,
    mealCalories,
    // Hedef kilo (yeni plan) bu tarihe kadar sabit; günlük kalori ve öğünler her zaman değiştirilebilir.
    lockedUntil: planHasDate(plan) ? plan.targetDate : toDateKey(addDays(today, MAINTAIN_LOCK_DAYS)),
  };
}

/** Hedef kilo (yeni plan) kilitli mi? Günlük kalori ve öğünler bu kilitten etkilenmez. */
export function isGoalLocked(goal: Goal, todayKey: string): boolean {
  return todayKey < goal.lockedUntil;
}

/**
 * Kullanıcı günlük kaloriyi değiştirince: hedef tarihi güncel kiloya ve yeni kaloriye göre yeniden
 * hesaplanır. Başlangıç, hedef kilo, hız ve kilit tarihi değişmez.
 */
export function updateGoalCalories(
  profile: PlanProfile,
  goal: Goal,
  currentWeightKg: number,
  dailyCalories: number,
  mealCalories: MealCalories,
  today: Date,
): { goal: Goal; plan: Plan } {
  const plan = planForProfile(profile, currentWeightKg, goal.targetWeightKg, goal.paceKgPerMonth, today, dailyCalories);
  const reached = currentWeightKg - goal.targetWeightKg <= MAINTAIN_THRESHOLD_KG;
  // Tarih yalnızca hesaplanabiliyorsa değişir; hedefe ulaşıldıysa bugün.
  const targetDate = planHasDate(plan) ? plan.targetDate : reached ? toDateKey(today) : goal.targetDate;
  return {
    plan,
    goal: {
      ...goal,
      dailyCalories: plan.dailyCalories,
      mealCalories,
      targetDate: targetDate < goal.startDate ? goal.startDate : targetDate,
    },
  };
}

// ---------- Öğünler ----------

export const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "Sabah",
  lunch: "Öğle",
  dinner: "Akşam",
};

/** Varsayılan dağılım %30 / %40 / %30, 10'a yuvarlanmış; kalan öğleye eklenir. */
export function defaultMealCalories(dailyCalories: number): MealCalories {
  const breakfast = Math.round((dailyCalories * 0.3) / 10) * 10;
  const dinner = Math.round((dailyCalories * 0.3) / 10) * 10;
  return { breakfast, lunch: dailyCalories - breakfast - dinner, dinner };
}

export function mealTotal(meals: MealCalories): number {
  return meals.breakfast + meals.lunch + meals.dinner;
}

/** Bir öğünü değiştirir; öğün 0'ın altına inmez. */
export function adjustMeal(meals: MealCalories, meal: Meal, delta: number): MealCalories {
  return { ...meals, [meal]: Math.max(MIN_MEAL_KCAL, meals[meal] + delta) };
}

export function isMealSplitValid(meals: MealCalories, dailyCalories: number): boolean {
  return MEALS.every((m) => Number.isInteger(meals[m]) && meals[m] >= MIN_MEAL_KCAL) && mealTotal(meals) === dailyCalories;
}

/**
 * Günlük kalori değişince öğünleri mevcut oranlarıyla yeniden dağıtır (10'a yuvarlanır, kalan en büyük
 * öğüne eklenir); böylece kahvaltıyı 0 yapan kullanıcının kahvaltısı 0 kalır. Hepsi 0 ise varsayılan dağılım.
 */
export function rescaleMeals(meals: MealCalories, dailyCalories: number): MealCalories {
  const total = mealTotal(meals);
  if (total <= 0) return defaultMealCalories(dailyCalories);
  const scaled = { breakfast: 0, lunch: 0, dinner: 0 } as MealCalories;
  for (const m of MEALS) scaled[m] = Math.round((meals[m] / total) * dailyCalories / 10) * 10;
  const largest = MEALS.reduce<Meal>((a, b) => (scaled[b] > scaled[a] ? b : a), "lunch");
  scaled[largest] += dailyCalories - mealTotal(scaled);
  return scaled;
}

/** 05–11 sabah, 11–16 öğle, 16–05 akşam. */
export function suggestMeal(hour: number): Meal {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  return "dinner";
}

/** Kalem kalorilerinin toplamı — Gemini'nin toplamına güvenilmez, toplamı kod hesaplar. */
export function sumKcal(items: Pick<FoodItem, "kcal">[]): number {
  return Math.round(
    items.reduce((sum, item) => sum + (Number.isFinite(item.kcal) ? Math.max(item.kcal, 0) : 0), 0),
  );
}

// ---------- Grafik ----------

/** Başlangıçtan hedefe doğrusal plan çizgisi. */
export function planLine(
  startDate: string,
  startWeightKg: number,
  targetDate: string,
  targetWeightKg: number,
): { date: string; weightKg: number }[] {
  if (targetDate <= startDate) return [{ date: startDate, weightKg: targetWeightKg }];
  return [
    { date: startDate, weightKg: startWeightKg },
    { date: targetDate, weightKg: targetWeightKg },
  ];
}

/** Bir kalemin kalorisi 0–5000 arası tam sayı olmalı (Firestore kuralı ile aynı sınır). */
export const MAX_ITEM_KCAL = 5000;
export const MAX_ITEM_NAME = 80;

export function clampItemKcal(kcal: number): number {
  return Number.isFinite(kcal) ? Math.min(Math.max(Math.round(kcal), 0), MAX_ITEM_KCAL) : 0;
}

// ---------- Su bardakları ----------

export const WATER_GLASS_ML = 200;
/** Bardaklar 5'erli sıralar hâlinde eklenip çıkarılır. */
export const WATER_ROW = 5;
/** Varsayılan: tek sıra. */
export const WATER_GLASS_COUNT = WATER_ROW;
/** En fazla 10 sıra (50 bardak = 10 L); Firestore kuralı günlük 20 L'ye izin verir. */
export const WATER_MAX_GLASSES = 50;

/**
 * Gösterilecek bardak sayısı: kullanıcının istediği sıra sayısı, ama toplam su her zaman görünecek kadar
 * (5'in katına yuvarlanmış), en az 1 en fazla 10 sıra.
 */
export function waterGlassCount(waterMl: number, requestedGlasses: number): number {
  const needed = Math.ceil(Math.max(0, waterMl) / WATER_GLASS_ML / WATER_ROW) * WATER_ROW;
  return Math.min(Math.max(requestedGlasses, needed, WATER_ROW), WATER_MAX_GLASSES);
}

/** Son sırayı kaldırınca: yeni bardak sayısı ve o sıradaki suyun düşülmesi için gereken değişim (ml, ≤ 0). */
export function removeWaterRow(waterMl: number, glassCount: number): { glasses: number; deltaMl: number } {
  const glasses = Math.max(glassCount - WATER_ROW, WATER_ROW);
  const capacity = glasses * WATER_GLASS_ML;
  return { glasses, deltaMl: -Math.max(0, waterMl - capacity) };
}

/** Her bardağın doluluk oranı (0–1). Bardaklar sırayla dolar; artan miktar sonraki bardağı kısmen doldurur. */
export function waterGlassFills(waterMl: number, count = WATER_GLASS_COUNT, glassMl = WATER_GLASS_ML): number[] {
  const total = Math.max(0, waterMl);
  return Array.from({ length: count }, (_, i) => Math.min(Math.max((total - i * glassMl) / glassMl, 0), 1));
}

/** Bardağa dokununca: boş bardak +200 ml, (kısmen) dolu bardak −200 ml. */
export function waterDeltaForGlass(fill: number, glassMl = WATER_GLASS_ML): number {
  return fill > 0 ? -glassMl : glassMl;
}
