import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AvatarMood } from "./definition";
import { INPUT_MOODS, REACTION_MS, TYPING_MS } from "./moods";

interface AvatarState {
  /** Şu an gösterilen duygu: tepki > ekranın temel duygusu. */
  mood: AvatarMood;
  /** Ekran/adım kimliği; değişince gezen avatar yeni bir boş yere gider. */
  scene: string;
  setBaseMood: (mood: AvatarMood) => void;
  setScene: (scene: string) => void;
  /** Kısa süreli tepki; süre bitince temel duyguya döner. */
  react: (mood: AvatarMood, ms?: number) => void;
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
  const [scene, setScene] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const react = useCallback((mood: AvatarMood, ms = REACTION_MS) => {
    setReaction(mood);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setReaction(null), ms);
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
    };
  }, [react]);

  const value = useMemo<AvatarState>(
    () => ({ mood: reaction ?? base, scene, setBaseMood: setBase, setScene, react }),
    [reaction, base, scene, react],
  );
  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatar(): AvatarState {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("useAvatar, AvatarProvider dışında kullanıldı");
  return ctx;
}

/**
 * Ekranın temel duygusunu ve sahnesini bildirir; değerler değiştikçe güncellenir.
 * mood null ise temel duyguya dokunulmaz (ör. alt bileşen kendi duygusunu yönetiyorsa).
 */
export function useAvatarMood(mood: AvatarMood | null, scene?: string) {
  const { setBaseMood, setScene } = useAvatar();
  useEffect(() => {
    if (mood) setBaseMood(mood);
  }, [mood, setBaseMood]);
  useEffect(() => {
    if (scene !== undefined) setScene(scene);
  }, [scene, setScene]);
}
