import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AvatarMood } from "./definition";
import { AUTH_MOODS, CELEBRATE_MS, INPUT_MOODS, REACTION_MS, TYPING_MS } from "./moods";

export type AvatarTint = "default" | "positive";

interface AvatarState {
  /** Şu an gösterilen duygu: tepki > ekranın temel duygusu. */
  mood: AvatarMood;
  /** Kısa süreli bir tepki oynuyor mu? (Oynuyorsa imleç takibi beklemeye alınır.) */
  reacting: boolean;
  /** Gövde rengi: varsayılan porselen, başarıda yeşil. */
  tint: AvatarTint;
  setBaseMood: (mood: AvatarMood) => void;
  /** Kısa süreli tepki; süre bitince temel duyguya döner. */
  react: (mood: AvatarMood, ms?: number) => void;
  /** Yeşile dön ve kutla; süre bitince porselene dön. */
  celebrate: (ms?: number) => void;
  /** Avatar bir sonraki görünüşünde kutlasın (ör. girişten sonra ana sayfaya ilk geliş). */
  celebrateOnArrival: () => void;
  /** Bekleyen kutlama varsa true döner ve işareti temizler. */
  consumeArrival: () => boolean;
}

const AvatarContext = createContext<AvatarState | null>(null);

/**
 * Avatarın duygu durumu.
 * - Ekranlar temel duyguyu useAvatarMood ile bildirir.
 * - `data-avatar="duygu"` taşıyan herhangi bir öğeye tıklanınca o duygu kısa süre oynar.
 * - Yazı yazılırken "dinliyor", şifre yazılırken "utangaç" olur.
 */
export function AvatarProvider({ children, initialMood = "idle" }: { children: ReactNode; initialMood?: AvatarMood }) {
  const [base, setBase] = useState<AvatarMood>(initialMood);
  const [reaction, setReaction] = useState<AvatarMood | null>(null);
  const [tint, setTint] = useState<AvatarTint>("default");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrival = useRef(false);

  const react = useCallback((mood: AvatarMood, ms = REACTION_MS) => {
    setReaction(mood);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setReaction(null), ms);
  }, []);

  const celebrate = useCallback(
    (ms = CELEBRATE_MS) => {
      setTint("positive");
      react(AUTH_MOODS.success, ms);
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      celebrateTimer.current = setTimeout(() => setTint("default"), ms);
    },
    [react],
  );

  const celebrateOnArrival = useCallback(() => {
    arrival.current = true;
  }, []);
  const consumeArrival = useCallback(() => {
    const pending = arrival.current;
    arrival.current = false;
    return pending;
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-avatar]");
      const mood = el?.getAttribute("data-avatar");
      if (mood) react(mood as AvatarMood);
    };
    const onInput = (e: Event) => {
      const el = e.target as HTMLInputElement | null;
      if (!el || !("value" in el)) return;
      if (el.type === "password") react(INPUT_MOODS.password, TYPING_MS + 400);
      else if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") react(INPUT_MOODS.typing, TYPING_MS);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("input", onInput);
      if (timer.current) clearTimeout(timer.current);
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    };
  }, [react]);

  const value = useMemo<AvatarState>(
    () => ({
      mood: reaction ?? base,
      reacting: reaction !== null,
      tint,
      setBaseMood: setBase,
      react,
      celebrate,
      celebrateOnArrival,
      consumeArrival,
    }),
    [reaction, base, tint, react, celebrate, celebrateOnArrival, consumeArrival],
  );
  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatar(): AvatarState {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("useAvatar, AvatarProvider dışında kullanıldı");
  return ctx;
}

/**
 * Ekranın temel duygusunu bildirir; değer değiştikçe güncellenir.
 * mood null ise temel duyguya dokunulmaz (ör. alt bileşen kendi duygusunu yönetiyorsa).
 */
export function useAvatarMood(mood: AvatarMood | null) {
  const { setBaseMood } = useAvatar();
  useEffect(() => {
    if (mood) setBaseMood(mood);
  }, [mood, setBaseMood]);
}
