// Avatar tanımı kök dizindeki avatar/ klasöründen gelir; renkler uygulama paletinden verilir
// ve imleci takip için kodla üretilen "bakış" ifadeleri eklenir.
import raw from "../../avatar/unknown.avatar.json";
import { COLORS } from "../config/theme";
import { GAZE_PITCHES, GAZE_YAWS, gazeKey } from "./gaze";

// Paket yalnızca küçük harfli hex kabul ediyor.
const hex = (c: string) => c.toLowerCase();

type Expression = (typeof raw.expressions)["neutral"];

/** Nötr gözlerle belirli bir açıya bakan ifade. Gözler de bakış yönüne biraz kayar. */
function gazeExpression(yaw: number, pitch: number): Expression {
  const n = raw.expressions.neutral;
  const eye = (e: Expression["eyes"]["left"]) => ({ ...e, x: yaw * 0.25, y: e.y - pitch * 0.5 });
  return {
    head: { x: pitch, y: yaw, z: 0 },
    eyes: { left: eye(n.eyes.left), right: eye(n.eyes.right), spacing: n.eyes.spacing },
    perspective: n.perspective,
    motion: { eyes: "none", body: "none" },
  };
}

const gaze: Record<string, Expression> = {};
for (const pitch of GAZE_PITCHES) for (const yaw of GAZE_YAWS) gaze[gazeKey(yaw, pitch)] = gazeExpression(yaw, pitch);

export const avatarDefinition = {
  ...raw,
  colors: { ...raw.colors, body: hex(COLORS.coffee), eyes: hex(COLORS.porcelain) },
  expressions: { ...raw.expressions, ...gaze } as Record<string, Expression>,
  expressionOrder: [...raw.expressionOrder, ...Object.keys(gaze)],
};

export type AvatarTone = "light" | "dark" | "positive";

/**
 * Avatar renkleri. Avatar tema düğmesidir; bir sonraki temanın rengini taşır:
 * açık temada siyah gövde + beyaz göz, koyu temada beyaz gövde + siyah göz, kutlamada yeşil gövde.
 */
export const AVATAR_COLORS: Record<AvatarTone, { body: string; eyes: string }> = {
  light: { body: hex(COLORS.coffee), eyes: hex(COLORS.porcelain) },
  dark: { body: hex(COLORS.porcelain), eyes: hex(COLORS.coffee) },
  positive: { body: hex(COLORS.teal), eyes: hex(COLORS.porcelain) },
};

export function definitionFor(tone: AvatarTone) {
  return { ...avatarDefinition, colors: AVATAR_COLORS[tone] };
}

/** Avatarın oynatabildiği her animasyon bir "duygu"dur. */
export type AvatarMood = keyof typeof raw.animations;
