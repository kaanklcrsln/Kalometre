import { useState } from "react";
import {
  adjustMeal,
  ageFromBirthYear,
  bmi,
  bmiCategory,
  birthYearFromAge,
  DEFAULT_PACE_KG_PER_MONTH,
  defaultMealCalories,
  goalFromPlan,
  isMealSplitValid,
  MAINTAIN_THRESHOLD_KG,
  MEAL_STEP_KCAL,
  MIN_ADULT_AGE,
  planForProfile,
  validateGoal,
  type Plan,
} from "../lib/calculations";
import { todayKey } from "../lib/dates";
import { parseDecimal } from "../lib/numbers";
import { validateAge, validateBodyFat, validateHeight, validateName, validateWeight } from "../lib/validation";
import { completeOnboarding, setWeight, updateUser } from "../services/db";
import type { Meal, MealCalories, Profile, Sex, SportEntry, UserDoc } from "../types";

export type OnboardingStep = "name" | "body" | "bmi" | "sports" | "target" | "pace" | "final";

/** new: ilk kurulum; replan: kilit bittikten sonra yeni plan (isim sorulmaz). */
export type OnboardingMode = "new" | "replan";

export interface SportRow extends SportEntry {
  key: number;
}

export interface OnboardingDraft {
  name: string;
  weightKg: string;
  heightCm: string;
  bodyFatPct: string;
  sex: Sex | null;
  age: string;
  sports: SportRow[];
  targetWeightKg: string;
  paceKgPerMonth: number;
}

let rowKey = 0;
const newRow = (sportId = ""): SportRow => ({ key: ++rowKey, sportId, daysPerWeek: 3 });

function initialDraft(existing: UserDoc | null): OnboardingDraft {
  const p = existing?.profile;
  const today = new Date();
  return {
    name: p?.name ?? "",
    weightKg: "",
    heightCm: p ? String(p.heightCm) : "",
    bodyFatPct: p?.bodyFatPct !== undefined ? String(p.bodyFatPct) : "",
    sex: p?.sex ?? null,
    age: p ? String(ageFromBirthYear(p.birthYear, today)) : "",
    sports: p?.sports.map((s) => ({ ...s, key: ++rowKey })) ?? [],
    targetWeightKg: "",
    paceKgPerMonth: DEFAULT_PACE_KG_PER_MONTH,
  };
}

export function useOnboarding(opts: {
  uid: string;
  username: string;
  mode: OnboardingMode;
  existing: UserDoc | null;
  onDone?: () => void;
}) {
  const { uid, username, mode, existing, onDone } = opts;
  const [draft, setDraft] = useState<OnboardingDraft>(() => initialDraft(existing));
  const [step, setStep] = useState<OnboardingStep>(mode === "new" ? "name" : "body");
  const [history, setHistory] = useState<OnboardingStep[]>([]);
  const [meals, setMeals] = useState<MealCalories | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const update = <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  // ---------- Türetilen değerler ----------
  const weightKg = parseDecimal(draft.weightKg);
  const heightCm = parseDecimal(draft.heightCm);
  const age = validateAge(draft.age) ? null : parseDecimal(draft.age);
  const isMinor = age !== null && age < MIN_ADULT_AGE;
  const bodyFatPct = draft.bodyFatPct.trim() ? parseDecimal(draft.bodyFatPct) : undefined;
  const targetWeightKg = isMinor ? weightKg : parseDecimal(draft.targetWeightKg);
  const isMaintain = isMinor || Math.abs(weightKg - targetWeightKg) < MAINTAIN_THRESHOLD_KG;

  const profile: Profile | null =
    draft.sex && age !== null
      ? {
          username,
          name: draft.name.trim(),
          sex: draft.sex,
          birthYear: birthYearFromAge(age, today),
          heightCm,
          bodyFatPct,
          sports: draft.sports.filter((s) => s.sportId).map(({ sportId, daysPerWeek }) => ({ sportId, daysPerWeek })),
        }
      : null;

  const planFor = (pace: number): Plan | null =>
    profile && Number.isFinite(targetWeightKg) ? planForProfile(profile, weightKg, targetWeightKg, pace, today) : null;

  const plan = step === "pace" || step === "final" ? planFor(draft.paceKgPerMonth) : null;
  const bmiValue = Number.isFinite(weightKg) && Number.isFinite(heightCm) ? bmi(weightKg, heightCm) : null;

  // ---------- Adım doğrulama ve geçişler ----------
  const validate = (): string | null => {
    switch (step) {
      case "name":
        return validateName(draft.name);
      case "body":
        return (
          validateWeight(draft.weightKg) ??
          validateHeight(draft.heightCm) ??
          (draft.bodyFatPct.trim() ? validateBodyFat(draft.bodyFatPct) : null) ??
          (draft.sex ? null : "Cinsiyetini seç.") ??
          validateAge(draft.age)
        );
      case "sports": {
        const chosen = draft.sports.filter((s) => s.sportId);
        if (draft.sports.some((s) => !s.sportId)) return "Eklediğin satırlarda spor seç ya da satırı sil.";
        if (new Set(chosen.map((s) => s.sportId)).size !== chosen.length) return "Aynı sporu iki kez ekleme.";
        return null;
      }
      case "target":
        if (isMinor) return null;
        if (validateWeight(draft.targetWeightKg)) return "Geçerli bir hedef kilo gir.";
        return validateGoal({ age: age ?? 0, heightCm, currentWeightKg: weightKg, targetWeightKg });
      default:
        return null;
    }
  };

  const nextStep = (): OnboardingStep | null => {
    switch (step) {
      case "name":
        return "body";
      case "body":
        return "bmi";
      case "bmi":
        return "sports";
      case "sports":
        return "target";
      case "target":
        return isMaintain ? "final" : "pace";
      case "pace":
        return "final";
      default:
        return null;
    }
  };

  const next = () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    const to = nextStep();
    if (!to) return;
    if (to === "final") {
      const p = planFor(isMaintain ? 0 : draft.paceKgPerMonth);
      if (p) setMeals(defaultMealCalories(p.dailyCalories));
    }
    setHistory((h) => [...h, step]);
    setStep(to);
    setError(null);
  };

  const back = () => {
    if (history.length === 0) return;
    setError(null);
    setStep(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  };

  // ---------- Sporlar ----------
  const sports = {
    add: () => update("sports", [...draft.sports, newRow()]),
    remove: (key: number) => update("sports", draft.sports.filter((s) => s.key !== key)),
    change: (key: number, patch: Partial<SportEntry>) =>
      update(
        "sports",
        draft.sports.map((s) => (s.key === key ? { ...s, ...patch } : s)),
      ),
  };

  // ---------- Öğünler ----------
  const mealsValid = !!(meals && plan && isMealSplitValid(meals, plan.dailyCalories));
  const changeMeal = (meal: Meal, direction: 1 | -1) => {
    if (meals) setMeals(adjustMeal(meals, meal, direction * MEAL_STEP_KCAL));
    setError(null);
  };

  const finish = async () => {
    if (!profile || !plan || !meals) return;
    if (!isMealSplitValid(meals, plan.dailyCalories)) {
      setError("Öğünlerin toplamı günlük kaloriye eşit olmalı.");
      return;
    }
    setSaving(true);
    setError(null);
    const goal = goalFromPlan(plan, weightKg, meals, today);
    try {
      if (mode === "new") {
        await completeOnboarding(uid, profile, goal, weightKg, todayKey());
      } else {
        await setWeight(uid, todayKey(), weightKg);
        await updateUser(uid, { profile, goal });
      }
      onDone?.();
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.");
      setSaving(false);
    }
  };

  const allSteps: OnboardingStep[] =
    mode === "new" ? ["name", "body", "bmi", "sports", "target", "pace", "final"] : ["body", "bmi", "sports", "target", "pace", "final"];

  return {
    step,
    progress: (allSteps.indexOf(step) + 1) / allSteps.length,
    canGoBack: history.length > 0,
    draft,
    update,
    error,
    saving,
    isMinor,
    isMaintain,
    bmi: bmiValue,
    bmiCategory: bmiValue !== null ? bmiCategory(bmiValue) : null,
    plan,
    /** Grafik ve butonlar için: her hızın planı. */
    planFor,
    meals,
    mealsValid,
    changeMeal,
    sports,
    next,
    back,
    finish,
  };
}
