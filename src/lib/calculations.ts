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
/** Koruma planında kilit süresi (gün). */
export const MAINTAIN_LOCK_DAYS = 30;
export const MEAL_STEP_KCAL = 50;
export const MIN_MEAL_KCAL = 100;

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

// ---------- Plan ----------

export interface PlanInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  sports: SportEntry[];
  targetWeightKg: number;
  paceKgPerMonth: number;
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
  direction: "lose" | "maintain";
  /** Etkin hedef (koruma planında mevcut kilo). */
  targetWeightKg: number;
  paceKgPerMonth: number;
  /** Taban uygulandıysa gerçekçi (düşürülmüş) hız; değilse seçilen hız. */
  effectiveKgPerMonth: number;
  dailyCalories: number;
  /** Günlük kalori sağlık tabanına çekildi mi? */
  floorApplied: boolean;
  days: number;
  /** yyyy-mm-dd */
  targetDate: string;
  notices: string[];
}

/**
 * Günlük hedef = bazal − seçilen hızın açığı (spor hesaba katılmaz).
 * Bu değer kadında 1200, erkekte 1500 kcal'nin altına inmez; inerse hedef tabana çekilir
 * ve tarih, spor dahil gerçek harcamadaki açığa göre dürüstçe yeniden hesaplanır.
 */
export function buildPlan(input: PlanInput): Plan {
  const { sex, age, heightCm, weightKg, bodyFatPct, sports, paceKgPerMonth, today } = input;
  const notices: string[] = [];

  const bmiValue = bmi(weightKg, heightCm);
  const bmrResult = bmr({ weightKg, heightCm, age, sex, bodyFatPct });
  const sportKcal = sportKcalPerDay(sports, weightKg);
  const burn = dailyBurn(bmrResult.value, sportKcal);
  const floor = MIN_DAILY_KCAL[sex];

  let targetWeightKg = input.targetWeightKg;
  let direction: Plan["direction"] =
    weightKg - targetWeightKg > MAINTAIN_THRESHOLD_KG ? "lose" : "maintain";
  if (direction === "lose" && age < MIN_ADULT_AGE) {
    notices.push("18 yaşından küçükler için kilo verme planı oluşturulmaz; kilonu koruma kalorisi gösteriliyor.");
    direction = "maintain";
  }

  let dailyCalories = Math.max(burn, floor);
  let effectiveKgPerMonth = 0;
  let floorApplied = false;

  if (direction === "lose") {
    const raw = bmrResult.value - dailyDeficitForPace(paceKgPerMonth);
    if (raw >= floor) {
      dailyCalories = raw;
      effectiveKgPerMonth = paceKgPerMonth;
    } else {
      floorApplied = true;
      dailyCalories = floor;
      effectiveKgPerMonth = Math.min(paceKgPerMonth, paceForDailyDeficit(burn - floor));
      if (effectiveKgPerMonth <= 0) {
        notices.push(
          `Sağlığın için günlük hedefin ${floor} kcal'nin altına inemez ve şu anki hareketinle bu kalori açık oluşturmuyor. Spor ekleyerek kilo vermeye başlayabilirsin.`,
        );
        direction = "maintain";
        effectiveKgPerMonth = 0;
        dailyCalories = Math.max(burn, floor);
      } else if (effectiveKgPerMonth < paceKgPerMonth) {
        const pace = effectiveKgPerMonth.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
        notices.push(
          `Sağlığın için günlük hedefin ${floor} kcal'nin altına inmiyor. Bu yüzden hareketine göre gerçekçi hızın ayda yaklaşık ${pace} kg.`,
        );
      } else {
        notices.push(`Sağlığın için günlük hedefin ${floor} kcal'nin altına inmiyor. Bu hıza yaptığın sporla ulaşacaksın.`);
      }
    }
  }

  if (direction === "maintain") targetWeightKg = weightKg;
  const days = direction === "lose" ? daysToGoal(weightKg, targetWeightKg, effectiveKgPerMonth) : 0;

  return {
    bmi: Math.round(bmiValue * 10) / 10,
    bmiCategory: bmiCategory(bmiValue),
    bmr: Math.round(bmrResult.value),
    bmrFormula: bmrResult.formula,
    sportKcalPerDay: Math.round(sportKcal),
    dailyBurn: Math.round(burn),
    direction,
    targetWeightKg,
    paceKgPerMonth: direction === "lose" ? paceKgPerMonth : 0,
    effectiveKgPerMonth: Math.round(effectiveKgPerMonth * 10) / 10,
    dailyCalories: Math.round(dailyCalories),
    floorApplied,
    days,
    targetDate: toDateKey(addDays(today, days)),
    notices,
  };
}

export function planForProfile(
  profile: Pick<Profile, "sex" | "birthYear" | "heightCm" | "bodyFatPct" | "sports">,
  weightKg: number,
  targetWeightKg: number,
  paceKgPerMonth: number,
  today: Date,
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
    today,
  });
}

export function goalFromPlan(
  plan: Plan,
  startWeightKg: number,
  mealCalories: MealCalories,
  today: Date,
): Goal {
  return {
    startWeightKg,
    startDate: toDateKey(today),
    targetWeightKg: plan.targetWeightKg,
    paceKgPerMonth: plan.paceKgPerMonth,
    targetDate: plan.targetDate,
    dailyCalories: plan.dailyCalories,
    mealCalories,
    lockedUntil:
      plan.direction === "maintain" ? toDateKey(addDays(today, MAINTAIN_LOCK_DAYS)) : plan.targetDate,
  };
}

export function isGoalLocked(goal: Goal, todayKey: string): boolean {
  return todayKey < goal.lockedUntil;
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

/** Bir öğünü değiştirir; öğün MIN_MEAL_KCAL'ın altına inmez. */
export function adjustMeal(meals: MealCalories, meal: Meal, delta: number): MealCalories {
  return { ...meals, [meal]: Math.max(MIN_MEAL_KCAL, meals[meal] + delta) };
}

export function isMealSplitValid(meals: MealCalories, dailyCalories: number): boolean {
  return MEALS.every((m) => meals[m] >= MIN_MEAL_KCAL) && mealTotal(meals) === dailyCalories;
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
