// Hangi durumda hangi duygu gösterilir — tek yerden ayarlanır.
import type { AvatarMood } from "./definition";

export const ONBOARDING_MOODS = {
  intro: "waking",
  auth: "curious",
  name: "curious",
  nameFilled: "happy",
  body: "curious",
  minor: "sad",
  bmiWord: "surprised",
  bmiMessage: "happy",
  sportsEmpty: "bored",
  sports: "excited",
  target: "thinking",
  paceRelaxed: "idle",
  paceNormal: "happy",
  paceFast: "excited",
  final: "proud",
  error: "confused",
  busy: "thinking",
} as const satisfies Record<string, AvatarMood>;

/** Kısa süreli tepkiler (ms). */
export const REACTION_MS = 1800;
export const TYPING_MS = 1200;

export const INPUT_MOODS = {
  typing: "listening",
  password: "shy",
} as const satisfies Record<string, AvatarMood>;

/** Avatara dokunulunca. */
export const TAP_MOOD: AvatarMood = "laughing";

/** Uygulama sekmeleri için hazır eşleme (avatar ileride ana ekranlarda da gösterilirse). */
export const ROUTE_MOODS: Record<string, AvatarMood> = {
  "/": "happy",
  "/add": "excited",
  "/chat": "listening",
  "/settings": "curious",
  "/weight": "proud",
};

/**
 * Tıklanınca avatarın kısa süre oynatacağı duygu. Tip güvenli kullanım:
 *   <button {...onTapMood("celebrate")}>…</button>
 */
export function onTapMood(mood: AvatarMood): { "data-avatar": AvatarMood } {
  return { "data-avatar": mood };
}
