import { useEffect, useState } from "react";
import { useAvatarMood } from "../avatar/AvatarProvider";
import { ONBOARDING_MOODS } from "../avatar/moods";

interface Props {
  label: string;
  bmi: number;
  name: string;
  onContinue: () => void;
}

const WORD_MS = 2200;
const FADE_MS = 600;

/** Kategori kırmızı belirir → söner → yeşil mesaj gelir. */
export function BmiReveal({ label, bmi, name, onContinue }: Props) {
  const [phase, setPhase] = useState<"word" | "leaving" | "message">("word");
  // Kırmızı kelimede irkilir, yeşil mesajda sevinir.
  useAvatarMood(phase === "message" ? ONBOARDING_MOODS.bmiMessage : ONBOARDING_MOODS.bmiWord, `bmi-${phase === "message" ? "message" : "word"}`);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("leaving"), WORD_MS);
    const t2 = setTimeout(() => setPhase("message"), WORD_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase !== "message") {
    return (
      <div className="stack center" onClick={() => setPhase("message")}>
        <p className={`muted ${phase === "word" ? "fade-in" : "fade-out"}`}>Vücut kitle indeksin {bmi.toFixed(1)}</p>
        <p className={`bmi-word ${phase === "word" ? "pop-in" : "fade-out"}`}>{label}</p>
      </div>
    );
  }

  return (
    <div className="stack-lg center">
      <p className="bmi-message fade-in">
        Çok da önemli bir veri değil {name}, sana dayatılan kelimelerden kaç ve fit olmaya odaklan…
      </p>
      <button type="button" className="btn btn-positive fade-in delay-2" onClick={onContinue}>
        Devam
      </button>
    </div>
  );
}
