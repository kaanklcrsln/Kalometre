import { createAvatar } from "@bible-strong/avatar-react";
import "@bible-strong/avatar-react/styles.css";
import { Component, useEffect, useRef, type ReactNode } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAvatar } from "./AvatarProvider";
import { definitionFor, type AvatarTone } from "./definition";
import { GAZE_IDLE_MS, INPUT_MOODS, TAP_MOOD } from "./moods";
import { useGaze } from "./useGaze";

// Avatar süs niteliğinde: tanım geçersizse uygulama çökmesin, avatar hiç görünmesin.
function safeCreate(tone: AvatarTone) {
  try {
    return createAvatar(definitionFor(tone));
  } catch (err) {
    console.error("[Kalometre] Avatar tanımı geçersiz, avatar gizlendi.", err);
    return null;
  }
}

// Her renk için tanım bir kez doğrulanır.
const AVATARS = {
  light: safeCreate("light"),
  dark: safeCreate("dark"),
  positive: safeCreate("positive"),
};

class AvatarErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.error("[Kalometre] Avatar hata verdi, gizlendi.", err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export interface MascotProps {
  size?: number;
  /** Yazarken "dinliyor" tepkisi yerine yazı imlecinin olduğu yere bak (sohbet ekranı). */
  followTyping?: boolean;
}

/**
 * Tema düğmesi olan avatar: tıklanınca açık/koyu tema değişir. İmleci ve tıklamaları takip eder,
 * duyguya göre tepki verir (sayfa akışında durur, sabit konumlu değil).
 */
export function Mascot({ size = 64, followTyping = false }: MascotProps) {
  if (!AVATARS.light || !AVATARS.dark) return null;
  return (
    <AvatarErrorBoundary>
      <MascotInner size={size} followTyping={followTyping} />
    </AvatarErrorBoundary>
  );
}

/** Alt bardaki sekme ikonu: temaya göre renklenen, etkileşimsiz küçük avatar. */
export function MascotIcon({ size = 26 }: { size?: number }) {
  const { theme } = useTheme();
  const Avatar = AVATARS[theme];
  if (!Avatar) return null;
  return (
    <AvatarErrorBoundary>
      <span className="nav-avatar" style={{ width: size, height: size }}>
        <Avatar animation="idle" size="100%" ariaLabel="" />
      </span>
    </AvatarErrorBoundary>
  );
}

function MascotInner({ size, followTyping }: { size: number; followTyping: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { mood, reacting, tint, react, celebrate, consumeArrival } = useAvatar();
  const { theme, toggle } = useTheme();
  const gaze = useGaze(ref, GAZE_IDLE_MS, { trackTyping: followTyping });

  // Girişten/üyelikten sonra ilk görünüşte yeşile dönüp kutla.
  useEffect(() => {
    if (consumeArrival()) celebrate();
  }, [consumeArrival, celebrate]);

  const tone: AvatarTone = tint === "positive" && AVATARS.positive ? "positive" : theme;
  const Avatar = AVATARS[tone]!;
  // Tepki (kutlama, dokunma, yazarken dinleme…) imleç takibinden önce gelir;
  // followTyping açıksa yazma tepkileri takibi engellemez.
  const typingReaction = mood === INPUT_MOODS.typing || mood === INPUT_MOODS.password;
  const following = gaze !== null && (!reacting || (followTyping && typingReaction));
  const isDark = theme === "dark";

  const onToggle = () => {
    toggle();
    react(TAP_MOOD);
  };

  return (
    <div
      className="mascot"
      style={{ width: size, height: size }}
      role="button"
      tabIndex={0}
      aria-pressed={isDark}
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      title={isDark ? "Açık tema" : "Koyu tema"}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div
        ref={ref}
        className="mascot-tilt"
        style={{ transform: following ? `rotate(${gaze.yaw * 0.12}deg) translateX(${gaze.yaw * 0.1}px)` : undefined }}
      >
        <div className="mascot-bob">
          {following ? (
            <Avatar key={tone} expression={gaze.key} size="100%" ariaLabel="Kalometre maskotu" />
          ) : (
            <Avatar key={tone} animation={mood} size="100%" ariaLabel="Kalometre maskotu" />
          )}
        </div>
      </div>
    </div>
  );
}
