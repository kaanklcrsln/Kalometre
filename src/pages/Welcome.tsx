import { useEffect, useState } from "react";
import { useAvatarMood } from "../avatar/AvatarProvider";
import { ONBOARDING_MOODS } from "../avatar/moods";
import { useAuthForm } from "../hooks/useAuthForm";

const INTRO_MS = 1400;
const FADE_MS = 600;

/** "Hoşgeldin." belirir, söner; ardından üye ol / giriş yap paneli gelir. */
export default function Welcome() {
  const [phase, setPhase] = useState<"intro" | "leaving" | "auth">("intro");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("leaving"), INTRO_MS);
    const t2 = setTimeout(() => setPhase("auth"), INTRO_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Uyuyan avatar "Hoşgeldin" ile uyanır.
  useAvatarMood(phase === "auth" ? null : ONBOARDING_MOODS.intro, phase === "auth" ? "auth" : "intro");

  if (phase !== "auth") {
    return (
      <main className="fullscreen" onClick={() => setPhase("auth")}>
        <h1 className={`welcome-word ${phase === "intro" ? "fade-in" : "fade-out"}`}>Hoşgeldin.</h1>
      </main>
    );
  }
  return <AuthPanel />;
}

function AuthPanel() {
  const f = useAuthForm();
  const isSignUp = f.mode === "signUp";
  useAvatarMood(f.error ? ONBOARDING_MOODS.error : f.busy ? ONBOARDING_MOODS.busy : ONBOARDING_MOODS.auth);

  return (
    <main className="fullscreen fade-in">
      <div className="stack">
        <h1 className="brand">Kalometre</h1>
        <p className="muted">Kalorini say, hedefine odaklan.</p>
      </div>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={isSignUp} onClick={() => f.setMode("signUp")}>
          Üye ol
        </button>
        <button type="button" role="tab" aria-selected={!isSignUp} onClick={() => f.setMode("signIn")}>
          Giriş yap
        </button>
      </div>

      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void f.submit();
        }}
      >
        <label className="field">
          <span>Kullanıcı adı</span>
          <input
            className="input"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={f.username}
            onChange={(e) => f.setUsername(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Şifre</span>
          <input
            className="input"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={f.password}
            onChange={(e) => f.setPassword(e.target.value)}
            required
          />
        </label>
        {isSignUp && <small className="muted">Harf, rakam, nokta ve alt çizgi · şifre en az 6 karakter</small>}
        {f.error && (
          <p className="alert" role="alert">
            {f.error}
          </p>
        )}
        <button type="submit" className="btn btn-block" disabled={f.busy}>
          {f.busy ? "Bekle…" : isSignUp ? "Üye ol" : "Giriş yap"}
        </button>
      </form>
    </main>
  );
}
