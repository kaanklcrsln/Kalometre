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

  it("taban yoksa: hedef = bazal − açık, hız seçilen hız", () => {
    const p = buildPlan({ ...man, weightKg: 130, targetWeightKg: 100 });
    expect(p.bmr).toBe(2280);
    expect(p.floorApplied).toBe(false);
    expect(p.dailyCalories).toBe(1510);
    expect(p.effectiveKgPerMonth).toBe(3);
    expect(p.days).toBe(300);
    expect(p.targetDate).toBe("2026-10-28");
    expect(p.notices).toEqual([]);
  });

  it("erkekte 1500 tabanı uygulanır ve tarih gerçek açığa göre hesaplanır", () => {
    const p = buildPlan(man);
    expect(p.floorApplied).toBe(true);
    expect(p.dailyCalories).toBe(1500);
    expect(p.dailyBurn).toBe(2136);
    // (2136 − 1500) × 30 / 7700 ≈ 2.48 kg/ay
    expect(p.effectiveKgPerMonth).toBe(2.5);
    expect(p.days).toBe(122);
    expect(p.notices).toHaveLength(1);
  });

  it("spor gerçek açığı artırır ama seçilen hızı aşmaz", () => {
    const p = buildPlan({ ...man, paceKgPerMonth: 4, sports: [{ sportId: "running", daysPerWeek: 3 }] });
    expect(p.sportKcalPerDay).toBe(302);
    expect(p.dailyCalories).toBe(1500);
    expect(p.effectiveKgPerMonth).toBe(3.7);
    expect(p.days).toBe(83);

    const lots = buildPlan({ ...man, paceKgPerMonth: 3, sports: [{ sportId: "martial", daysPerWeek: 7 }] });
    expect(lots.effectiveKgPerMonth).toBe(3);
  });

  it("kadında 1200 tabanı", () => {
    const p = buildPlan({ ...man, sex: "female", weightKg: 100, heightCm: 165, targetWeightKg: 80, paceKgPerMonth: 4 });
    expect(p.dailyCalories).toBe(1200);
    expect(p.effectiveKgPerMonth).toBe(3.4);
  });

  it("günlük kalori asla tabanın altına inmez", () => {
    for (const sex of ["male", "female"] as const) {
      for (const w of [55, 70, 90, 120, 160]) {
        for (const pace of [3, 4, 6]) {
          const p = buildPlan({ ...man, sex, weightKg: w, targetWeightKg: Math.max(w - 10, 60), paceKgPerMonth: pace });
          expect(p.dailyCalories).toBeGreaterThanOrEqual(sex === "male" ? 1500 : 1200);
        }
      }
    }
  });

  it("harcama tabanın altındaysa koruma planına döner", () => {
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

  it("18 yaş altında kilo verme yerine koruma", () => {
    const p = buildPlan({ ...man, age: 16 });
    expect(p.direction).toBe("maintain");
    expect(p.targetWeightKg).toBe(80);
  });
});

describe("goalFromPlan / kilit", () => {
  const meals = { breakfast: 450, lunch: 600, dinner: 450 };
  it("kilo verme planı hedef tarihine kadar kilitli", () => {
    const plan = buildPlan({
      sex: "male", age: 30, heightCm: 180, weightKg: 130, sports: [], targetWeightKg: 100, paceKgPerMonth: 3, today,
    });
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
});

describe("öğünler", () => {
  it("varsayılan dağılım toplamı günlük kaloriye eşit", () => {
    expect(defaultMealCalories(1500)).toEqual({ breakfast: 450, lunch: 600, dinner: 450 });
    const odd = defaultMealCalories(1517);
    expect(odd.breakfast + odd.lunch + odd.dinner).toBe(1517);
  });
  it("öğün ayarı en az 100 kcal", () => {
    expect(adjustMeal({ breakfast: 150, lunch: 600, dinner: 450 }, "breakfast", -100).breakfast).toBe(100);
    expect(adjustMeal({ breakfast: 450, lunch: 600, dinner: 450 }, "lunch", 50).lunch).toBe(650);
  });
  it("dağılım geçerliliği", () => {
    expect(isMealSplitValid({ breakfast: 450, lunch: 600, dinner: 450 }, 1500)).toBe(true);
    expect(isMealSplitValid({ breakfast: 500, lunch: 600, dinner: 450 }, 1500)).toBe(false);
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
