import { createAvatar } from "@bible-strong/avatar-react";
import "@bible-strong/avatar-react/styles.css";
import { Component, useRef, type CSSProperties, type ReactNode } from "react";
import { useAvatar } from "./AvatarProvider";
import { avatarDefinition } from "./definition";
import { TAP_MOOD } from "./moods";
import { useRoaming, type RoamingOptions } from "./useRoaming";

// Avatar süs niteliğinde: tanım geçersizse uygulama çökmesin, avatar hiç görünmesin.
let MascotAvatar: ReturnType<typeof createAvatar<typeof avatarDefinition>> | null = null;
try {
  MascotAvatar = createAvatar(avatarDefinition);
} catch (err) {
  console.error("[Kalometre] Avatar tanımı geçersiz, avatar gizlendi.", err);
}

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

/** Ekranın boş alanlarında gezen, o anki duyguyu oynatan avatar. */
export function RoamingAvatar(props: RoamingOptions) {
  if (!MascotAvatar) return null;
  return (
    <AvatarErrorBoundary>
      <Roamer {...props} />
    </AvatarErrorBoundary>
  );
}

function Roamer(props: RoamingOptions) {
  const Mascot = MascotAvatar!;
  const ref = useRef<HTMLDivElement>(null);
  const { mood, scene, react } = useAvatar();
  const { spot, moving, durationMs, direction } = useRoaming(ref, { trigger: scene, ...props });

  const style: CSSProperties = spot
    ? {
        transform: `translate3d(${spot.x}px, ${spot.y}px, 0)`,
        width: spot.size,
        height: spot.size,
        transitionDuration: `${durationMs}ms`,
        opacity: spot.crowded ? 0.55 : 1,
        pointerEvents: spot.crowded ? "none" : "auto",
      }
    : { opacity: 0, pointerEvents: "none" };

  return (
    <div ref={ref} className="roamer" style={style} aria-hidden onClick={() => react(TAP_MOOD)}>
      <div className={`roamer-tilt ${moving ? "moving" : ""}`} style={{ "--tilt": `${direction * 8}deg` } as CSSProperties}>
        <div className="roamer-bob">
          <Mascot animation={mood} size="100%" ariaLabel="Kalometre maskotu" />
        </div>
      </div>
    </div>
  );
}
