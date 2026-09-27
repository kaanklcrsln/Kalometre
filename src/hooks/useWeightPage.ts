import { useState } from "react";
import { planLine } from "../lib/calculations";
import { todayKey } from "../lib/dates";
import { parseDecimal } from "../lib/numbers";
import { validateWeight } from "../lib/validation";
import { deleteWeight, setWeight } from "../services/db";
import type { UserDoc } from "../types";
import { useWeights } from "./useWeights";

/** Kilo kaydı. Yeni kilo kalori hedefini kendiliğinden değiştirmez; kullanıcı hedefi düzenleyince tarih son kiloya göre hesaplanır. */
export function useWeightPage(uid: string, userDoc: UserDoc) {
  const { weights, latest, loading } = useWeights(uid);
  const [date, setDate] = useState(todayKey());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayKey();
  const goal = userDoc.goal;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const invalid = validateWeight(input);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (date > today) {
      setError("Gelecek bir tarihe kilo girilemez.");
      return;
    }
    const weightKg = Math.round(parseDecimal(input) * 10) / 10;
    return run(async () => {
      await setWeight(uid, date, weightKg);
      setInput("");
    });
  };

  const remove = (dateKey: string) => {
    if (weights.length <= 1) {
      setError("Son kilo kaydı silinemez.");
      return;
    }
    return run(() => deleteWeight(uid, dateKey));
  };

  const planPoints = goal ? planLine(goal.startDate, goal.startWeightKg, goal.targetDate, goal.targetWeightKg) : [];
  const lostKg = goal && latest ? Math.round((goal.startWeightKg - latest.weightKg) * 10) / 10 : 0;

  return { loading, weights, latest, goal, planPoints, lostKg, date, input, busy, error, setDate, setInput, save, remove };
}
