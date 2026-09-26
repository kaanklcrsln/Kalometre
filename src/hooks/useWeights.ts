import { useEffect, useState } from "react";
import { subscribeWeights } from "../services/db";
import type { WeightEntry } from "../types";

export function useWeights(uid: string) {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      subscribeWeights(
        uid,
        (w) => {
          setWeights(w);
          setLoading(false);
        },
        (err) => {
          console.error(err);
          setLoading(false);
        },
      ),
    [uid],
  );

  const latest = weights.length ? weights[weights.length - 1] : null;
  return { weights, latest, loading };
}
