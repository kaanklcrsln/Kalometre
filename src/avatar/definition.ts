// Avatar tanımı kök dizindeki avatar/ klasöründen gelir; renkler uygulama paletine sabitlenir.
import raw from "../../avatar/unknown.avatar.json";
import { COLORS } from "../config/theme";

export const avatarDefinition = {
  ...raw,
  // Paket yalnızca küçük harfli hex kabul ediyor.
  colors: { ...raw.colors, body: COLORS.porcelain.toLowerCase(), eyes: COLORS.coffee.toLowerCase() },
};

/** Avatarın oynatabildiği her animasyon bir "duygu"dur. */
export type AvatarMood = keyof typeof avatarDefinition.animations;
