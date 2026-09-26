import { useState } from "react";
import { isGoalLocked } from "../lib/calculations";
import { daysBetween, todayKey } from "../lib/dates";
import { validateName } from "../lib/validation";
import { signOut } from "../services/auth";
import { updateUser } from "../services/db";
import type { UserDoc } from "../types";

export function useSettings(uid: string, userDoc: UserDoc) {
  const { profile, goal } = userDoc;
  const [name, setName] = useState(profile.name);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const today = todayKey();
  const locked = goal ? isGoalLocked(goal, today) : false;
  const lockDaysLeft = goal && locked ? daysBetween(today, goal.lockedUntil) : 0;

  const saveName = async () => {
    const invalid = validateName(name);
    if (invalid) {
      setMessage({ kind: "error", text: invalid });
      return;
    }
    setBusy(true);
    try {
      await updateUser(uid, { profile: { ...profile, name: name.trim() } });
      setMessage({ kind: "ok", text: `Kaydedildi, ${name.trim()}.` });
    } catch (err) {
      console.error(err);
      setMessage({ kind: "error", text: "Kaydedilemedi. Tekrar dene." });
    } finally {
      setBusy(false);
    }
  };

  return {
    name,
    setName: (v: string) => {
      setName(v);
      setMessage(null);
    },
    nameChanged: name.trim() !== profile.name,
    busy,
    message,
    saveName,
    goal,
    locked,
    lockDaysLeft,
    signOut: () => void signOut(),
  };
}
