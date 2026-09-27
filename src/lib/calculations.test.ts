import { describe, expect, it } from "vitest";
import {
  adjustMeal,
  ageFromBirthYear,
  birthYearFromAge,
  bmi,
  bmiCategory,
  bmr,
  bmrKatchMcArdle,
  bmrMifflinStJeor,
  buildPlan,
  dailyBurn,
  dailyDeficitForPace,
  daysToGoal,
  defaultMealCalories,
  goalFromPlan,
  isGoalLocked,
  isMealSplitValid,
  KCAL_PER_KG,
  paceChoices,
  rescaleMeals,
  safePace,
  updateGoalCalories,
  planLine,
  sportKcalPerDay,
  suggestMeal,
  sumKcal,
  validateGoal,
  type PlanInput,
} from "./calculations";

const today = new Date(2026, 0, 1); // 1 Ocak 2026, yerel

describe("yaş", () => {
  it("doğum yılından yaş ve tersi", () => {
    expect(ageFromBirthYear(1996, today)).toBe(30);
    expect(birthYearFromAge(30, today)).toBe(1996);
  });
});

describe("VKİ", () => {
  it("kg / m²", () => {
    expect(bmi(80, 180)).toBeCloseTo(24.691, 3);
  });
  it.each([
    [18.4, "underweight"],
    [18.5, "normal"],
    [24.9, "normal"],
    [25, "overweight"],
    [29.9, "overweight"],
    [30, "obese"],
  ] as const)("VKİ %s → %s", (value, category) => {
    expect(bmiCategory(value)).toBe(category);
  });
});

describe("bazal metabolizma", () => {
  it("Mifflin-St Jeor erkek / kadın", () => {
    expect(bmrMifflinStJeor(80, 180, 30, "male")).toBe(1780);
    expect(bmrMifflinStJeor(80, 180, 30, "female")).toBe(1614);
  });
  it("Katch-McArdle", () => {
    expect(bmrKatchMcArdle(80, 20)).toBeCloseTo(1752.4, 6);
  });
  it("yağ oranı girildiyse Katch-McArdle, girilmediyse Mifflin", () => {
    expect(bmr({ weightKg: 80, heightCm: 180, age: 30, sex: "male", bodyFatPct: 20 }).formula).toBe("katch-mcardle");
    expect(bmr({ weightKg: 80, heightCm: 180, age: 30, sex: "male" }).value).toBe(1780);
  });
});

describe("spor ve harcama", () => {
  it("koşu haftada 3 gün, 80 kg: (9.8−1)×80×3/7", () => {
    expect(sportKcalPerDay([{ sportId: "running", daysPerWeek: 3 }], 80)).toBeCloseTo(301.714, 2);
  });
  it("birden fazla spor toplanır", () => {
    const one = sportKcalPerDay([{ sportId: "running", daysPerWeek: 3 }], 80);
    const two = sportKcalPerDay([{ sportId: "yoga", daysPerWeek: 2 }], 80);
    expect(
      sportKcalPerDay([{ sportId: "running", daysPerWeek: 3 }, { sportId: "yoga", daysPerWeek: 2 }], 80),
    ).toBeCloseTo(one + two, 6);
  });
  it("bilinmeyen spor 0, gün sayısı 0–7 arasına kırpılır", () => {
    expect(sportKcalPerDay([{ sportId: "nope", daysPerWeek: 3 }], 80)).toBe(0);
    expect(sportKcalPerDay([{ sportId: "running", daysPerWeek: 10 }], 80)).toBeCloseTo(8.8 * 80, 6);
  });
  it("günlük harcama = bazal × 1.2 + spor", () => {
    expect(dailyBurn(1780, 300)).toBeCloseTo(2436, 6);
  });
});

describe("hız", () => {
  it("ayda kg → günlük açık", () => {
    expect(dailyDeficitForPace(3)).toBe(770);
    expect(dailyDeficitForPace(6)).toBe(1540);
  });
  it("hedefe gün sayısı", () => {
    expect(daysToGoal(80, 70, 4)).toBe(75);
    expect(daysToGoal(80, 80, 4)).toBe(0);
    expect(daysToGoal(80, 70, 0)).toBe(Infinity);
  });
});

describe("validateGoal", () => {
  const base = { age: 30, heightCm: 180, currentWeightKg: 80 };
  it("sağlıklı kilo verme hedefini kabul eder", () => {
    expect(validateGoal({ ...base, targetWeightKg: 70 })).toBeNull();
  });
  it("koruma (hedef = mevcut) kabul edilir", () => {
    expect(validateGoal({ ...base, targetWeightKg: 80 })).toBeNull();
  });
  it("mevcut kilodan yüksek hedef reddedilir", () => {
    expect(validateGoal({ ...base, targetWeightKg: 85 })).not.toBeNull();
  });
  it("VKİ < 18.5 hedef reddedilir ve en düşük kilo söylenir", () => {
    expect(validateGoal({ ...base, targetWeightKg: 55 })).toContain("60");
  });
  it("18 yaş altında kilo verme reddedilir", () => {
    expect(validateGoal({ ...base, age: 16, targetWeightKg: 70 })).not.toBeNull();
  });
});

describe("buildPlan", () => {
  const man: PlanInput = {
    sex: "male",
    age: 30,
    heightCm: 180,
    weightKg: 80,
    sports: [],
    targetWeightKg: 70,
    paceKgPerMonth: 3,
    today,
  };

  it("öneri = harcama (bazal × 1.2 + spor) − hızın açığı; tarih aynı açıktan", () => {
    const p = buildPlan({ ...man, weightKg: 130, targetWeightKg: 100 });
    expect(p.bmr).toBe(2280);
    expect(p.dailyBurn).toBe(2736);
    expect(p.suggestedCalories).toBe(1966);
    expect(p.dailyCalories).toBe(1966);
    expect(p.dailyDeficit).toBe(770);
    expect(p.monthlyKg).toBe(3);
    // 30 kg × 7700 / 770 = 300 gün = 30 / 3 × 30
    expect(p.days).toBe(300);
    expect(p.targetDate).toBe("2026-10-28");
    expect(p.notices).toEqual([]);
  });

  it("herkes aynı kaloriyi almaz: harcamaya göre değişir", () => {
    const small = buildPlan({ ...man, weightKg: 100, targetWeightKg: 90 });
    const big = buildPlan({ ...man, weightKg: 130, targetWeightKg: 90 });
    const sporty = buildPlan({ ...man, weightKg: 100, targetWeightKg: 90, sports: [{ sportId: "running", daysPerWeek: 4 }] });
    expect(new Set([small.dailyCalories, big.dailyCalories, sporty.dailyCalories]).size).toBe(3);
  });

  it("seçilen hız, gösterilen aylık kilo ve gün sayısı her zaman tutarlı", () => {
    for (const sex of ["male", "female"] as const) {
      for (const w of [70, 90, 120, 160]) {
        for (const pace of [3, 4, 6]) {
          const p = buildPlan({ ...man, sex, weightKg: w, targetWeightKg: Math.max(w - 15, 60), paceKgPerMonth: pace });
          if (p.direction !== "lose") continue;
          expect(p.dailyDeficit).toBe(p.dailyBurn - p.dailyCalories);
          expect(p.days).toBe(Math.ceil(((w - p.targetWeightKg) * KCAL_PER_KG) / p.dailyDeficit));
          expect(p.monthlyKg).toBeCloseTo((p.dailyDeficit * 30) / KCAL_PER_KG, 1);
          if (pace <= p.maxSafeKgPerMonth) expect(p.monthlyKg).toBeCloseTo(pace, 1);
          else expect(p.dailyCalories).toBe(sex === "male" ? 1500 : 1200);
        }
      }
    }
  });

  it("güvenli en yüksek hız = (harcama − taban) × 30 / 7700; üstündeki hızlar güvenli değil", () => {
    const p = buildPlan({ ...man, sex: "female", weightKg: 100, heightCm: 165, targetWeightKg: 80, paceKgPerMonth: 4 });
    expect(p.dailyBurn).toBe(2064);
    expect(p.maxSafeKgPerMonth).toBe(3.4);
    expect(paceChoices(p, "female").map((c) => c.safe)).toEqual([true, false, false]);
    expect(paceChoices(p, "female")[0].suggestedCalories).toBe(1294);
    expect(safePace(6, paceChoices(p, "female"))).toBe(3);
  });

  it("kullanıcının seçtiği kalori tarihi belirler; taban ve 6000 sınırı", () => {
    const base = { ...man, weightKg: 130, targetWeightKg: 100 };
    const p = buildPlan({ ...base, dailyCalories: 2136 });
    expect(p.dailyCalories).toBe(2136);
    expect(p.dailyDeficit).toBe(600);
    expect(p.days).toBe(385);
    expect(buildPlan({ ...base, dailyCalories: 900 }).dailyCalories).toBe(1500);
    expect(buildPlan({ ...base, dailyCalories: 9000 }).dailyCalories).toBe(6000);
  });

  it("harcamaya eşit ya da fazla kaloriyle hedefe ulaşılamaz", () => {
    const p = buildPlan({ ...man, weightKg: 130, targetWeightKg: 100, dailyCalories: 2800 });
    expect(p.reachable).toBe(false);
    expect(p.days).toBe(0);
    expect(p.notices).toHaveLength(1);
  });

  it("günlük kalori asla tabanın altına inmez", () => {
    for (const sex of ["male", "female"] as const) {
      for (const w of [55, 70, 90, 120, 160]) {
        for (const pace of [3, 4, 6]) {
          const p = buildPlan({ ...man, sex, weightKg: w, targetWeightKg: Math.max(w - 10, 60), paceKgPerMonth: pace, dailyCalories: 0 });
          expect(p.dailyCalories).toBeGreaterThanOrEqual(sex === "male" ? 1500 : 1200);
        }
      }
    }
  });

  it("tabanda bile açık yoksa koruma planına döner", () => {
    const p = buildPlan({ ...man, weightKg: 50, heightCm: 150, age: 60, targetWeightKg: 45 });
    expect(p.direction).toBe("maintain");
    expect(p.dailyCalories).toBe(1500);
    expect(p.notices).toHaveLength(1);
  });

  it("hedef = mevcut: koruma, spor dahil harcama", () => {
    const p = buildPlan({ ...man, targetWeightKg: 80 });
    expect(p.direction).toBe("maintain");
    expect(p.dailyCalories).toBe(2136);
    expect(p.days).toBe(0);
  });

  it("18 yaş altında kilo verme yok, kalori harcamanın altına inmez", () => {
    const p = buildPlan({ ...man, age: 16, dailyCalories: 1600 });
    expect(p.direction).toBe("maintain");
    expect(p.targetWeightKg).toBe(80);
    expect(p.dailyCalories).toBe(p.dailyBurn);
  });
});

describe("goalFromPlan / kilit / kalori değişimi", () => {
  const meals = { breakfast: 590, lunch: 786, dinner: 590 };
  const profile = { sex: "male" as const, birthYear: 1996, heightCm: 180, sports: [] };
  const losePlan = () =>
    buildPlan({ sex: "male", age: 30, heightCm: 180, weightKg: 130, sports: [], targetWeightKg: 100, paceKgPerMonth: 3, today });

  it("kilo verme planında hedef kilo hedef tarihine kadar kilitli", () => {
    const plan = losePlan();
    const goal = goalFromPlan(plan, 130, meals, today);
    expect(goal.startDate).toBe("2026-01-01");
    expect(goal.lockedUntil).toBe(plan.targetDate);
    expect(isGoalLocked(goal, "2026-10-27")).toBe(true);
    expect(isGoalLocked(goal, "2026-10-28")).toBe(false);
  });
  it("koruma planı 30 gün kilitli", () => {
    const plan = buildPlan({
      sex: "male", age: 30, heightCm: 180, weightKg: 80, sports: [], targetWeightKg: 80, paceKgPerMonth: 4, today,
    });
    expect(goalFromPlan(plan, 80, meals, today).lockedUntil).toBe("2026-01-31");
  });
  it("kalori değişince tarih güncel kiloya göre yeniden hesaplanır, kilit değişmez", () => {
    const goal = goalFromPlan(losePlan(), 130, meals, today);
    const later = new Date(2026, 1, 1);
    const { goal: next, plan } = updateGoalCalories(profile, goal, 125, 2000, { breakfast: 0, lunch: 1000, dinner: 1000 }, later);
    expect(next.dailyCalories).toBe(2000);
    expect(next.lockedUntil).toBe(goal.lockedUntil);
    expect(next.startDate).toBe(goal.startDate);
    expect(next.targetWeightKg).toBe(100);
    expect(next.mealCalories.breakfast).toBe(0);
    expect(plan.days).toBe(Math.ceil((25 * KCAL_PER_KG) / plan.dailyDeficit));
    expect(next.targetDate).toBe(plan.targetDate);
  });
});
describe("öğünler", () => {
  it("varsayılan dağılım toplamı günlük kaloriye eşit", () => {
    expect(defaultMealCalories(1500)).toEqual({ breakfast: 450, lunch: 600, dinner: 450 });
    const odd = defaultMealCalories(1517);
    expect(odd.breakfast + odd.lunch + odd.dinner).toBe(1517);
  });
  it("öğün 0 olabilir, eksiye inmez", () => {
    expect(adjustMeal({ breakfast: 50, lunch: 600, dinner: 450 }, "breakfast", -50).breakfast).toBe(0);
    expect(adjustMeal({ breakfast: 0, lunch: 600, dinner: 450 }, "breakfast", -50).breakfast).toBe(0);
    expect(isMealSplitValid({ breakfast: 0, lunch: 900, dinner: 600 }, 1500)).toBe(true);
    expect(adjustMeal({ breakfast: 450, lunch: 600, dinner: 450 }, "lunch", 50).lunch).toBe(650);
  });
  it("dağılım geçerliliği", () => {
    expect(isMealSplitValid({ breakfast: 450, lunch: 600, dinner: 450 }, 1500)).toBe(true);
    expect(isMealSplitValid({ breakfast: 500, lunch: 600, dinner: 450 }, 1500)).toBe(false);
  });
  it("kalori değişince öğünler oranlarıyla yeniden dağılır, 0 olan 0 kalır", () => {
    expect(rescaleMeals({ breakfast: 0, lunch: 900, dinner: 600 }, 2000)).toEqual({ breakfast: 0, lunch: 1200, dinner: 800 });
    const r = rescaleMeals({ breakfast: 450, lunch: 600, dinner: 450 }, 1733);
    expect(r.breakfast + r.lunch + r.dinner).toBe(1733);
    expect(rescaleMeals({ breakfast: 0, lunch: 0, dinner: 0 }, 1500)).toEqual({ breakfast: 450, lunch: 600, dinner: 450 });
  });
  it.each([
    [4, "dinner"],
    [5, "breakfast"],
    [11, "lunch"],
    [16, "dinner"],
  ] as const)("saat %s → %s", (hour, meal) => {
    expect(suggestMeal(hour)).toBe(meal);
  });
});

describe("sumKcal", () => {
  it("toplar, negatif ve geçersizleri yok sayar", () => {
    expect(sumKcal([{ kcal: 100.4 }, { kcal: 200.4 }])).toBe(301);
    expect(sumKcal([{ kcal: 100 }, { kcal: -50 }, { kcal: NaN }])).toBe(100);
  });
});

describe("planLine", () => {
  it("başlangıçtan hedefe iki nokta", () => {
    expect(planLine("2026-01-01", 80, "2026-03-17", 70)).toEqual([
      { date: "2026-01-01", weightKg: 80 },
      { date: "2026-03-17", weightKg: 70 },
    ]);
  });
});

describe("clampItemKcal", () => {
  it("0–5000 arasına kırpar ve yuvarlar", async () => {
    const { clampItemKcal } = await import("./calculations");
    expect(clampItemKcal(250.6)).toBe(251);
    expect(clampItemKcal(-5)).toBe(0);
    expect(clampItemKcal(99999)).toBe(5000);
    expect(clampItemKcal(NaN)).toBe(0);
  });
});

describe("su bardakları", () => {
  it("bardaklar sırayla dolar", async () => {
    const { waterGlassFills } = await import("./calculations");
    expect(waterGlassFills(0, 5)).toEqual([0, 0, 0, 0, 0]);
    expect(waterGlassFills(400, 5)).toEqual([1, 1, 0, 0, 0]);
    expect(waterGlassFills(1000, 5)).toEqual([1, 1, 1, 1, 1]);
  });
  it("200'ün katı olmayan miktar son bardağı kısmen doldurur", async () => {
    const { waterGlassFills } = await import("./calculations");
    expect(waterGlassFills(250, 5).slice(0, 3)).toEqual([1, 0.25, 0]);
  });
  it("negatif miktar boş, kapasiteyi aşan miktar hepsini dolu gösterir", async () => {
    const { waterGlassFills } = await import("./calculations");
    expect(waterGlassFills(-100, 5)).toEqual([0, 0, 0, 0, 0]);
    expect(waterGlassFills(3500, 5)).toEqual([1, 1, 1, 1, 1]);
  });
  it("dokunma: boş +200, dolu ya da kısmen dolu −200", async () => {
    const { waterDeltaForGlass } = await import("./calculations");
    expect(waterDeltaForGlass(0)).toBe(200);
    expect(waterDeltaForGlass(1)).toBe(-200);
    expect(waterDeltaForGlass(0.25)).toBe(-200);
  });
  it("bardak sayısı: varsayılan 5, istenen sıra, su sığmazsa otomatik sıra", async () => {
    const { waterGlassCount } = await import("./calculations");
    expect(waterGlassCount(0, 5)).toBe(5);
    expect(waterGlassCount(0, 10)).toBe(10);
    expect(waterGlassCount(1000, 5)).toBe(5);
    expect(waterGlassCount(1200, 5)).toBe(10);
    expect(waterGlassCount(2250, 5)).toBe(15);
    expect(waterGlassCount(0, 0)).toBe(5);
    expect(waterGlassCount(99999, 5)).toBe(50);
    expect(waterGlassCount(0, 500)).toBe(50);
  });
  it("sıra kaldırma: o sıradaki su düşülür, en az 5 bardak kalır", async () => {
    const { removeWaterRow } = await import("./calculations");
    expect(removeWaterRow(1400, 10)).toEqual({ glasses: 5, deltaMl: -400 });
    expect(removeWaterRow(600, 10)).toEqual({ glasses: 5, deltaMl: -0 });
    expect(removeWaterRow(2000, 10)).toEqual({ glasses: 5, deltaMl: -1000 });
    expect(removeWaterRow(1100, 15)).toEqual({ glasses: 10, deltaMl: -0 });
    expect(removeWaterRow(800, 5)).toEqual({ glasses: 5, deltaMl: -0 });
  });
});
