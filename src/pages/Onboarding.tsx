import { lazy, Suspense } from "react";
import { useNavigate } from "react-router";
import { useAvatarMood } from "../avatar/AvatarProvider";
import type { AvatarMood } from "../avatar/definition";
import { ONBOARDING_MOODS as M, onTapMood } from "../avatar/moods";
import { BmiReveal } from "../components/BmiReveal";
import { MealSplitEditor } from "../components/MealSplitEditor";
import { SportsPicker } from "../components/SportsPicker";
import { useOnboarding, type OnboardingDraft, type OnboardingMode } from "../hooks/useOnboarding";
import { BMI_CATEGORY_LABELS, PACES } from "../lib/calculations";
import { formatDateTr } from "../lib/dates";
import { signOut, type AuthUser } from "../services/auth";
import type { Sex, UserDoc } from "../types";

// recharts yalnızca hız adımında yüklensin.
const PaceChart = lazy(() => import("../components/PaceChart").then((m) => ({ default: m.PaceChart })));

/** Adıma ve girilen verilere göre avatarın temel duygusu. VKİ adımında BmiReveal kendisi yönetir (null). */
function moodFor(o: ReturnType<typeof useOnboarding>, d: OnboardingDraft): AvatarMood | null {
  if (o.error) return M.error;
  if (o.saving) return M.busy;
  switch (o.step) {
    case "name":
      return d.name.trim() ? M.nameFilled : M.name;
    case "body":
      return o.isMinor ? M.minor : M.body;
    case "bmi":
      return null;
    case "sports":
      return d.sports.length ? M.sports : M.sportsEmpty;
    case "target":
      return M.target;
    case "pace":
      return d.paceKgPerMonth <= 3 ? M.paceRelaxed : d.paceKgPerMonth >= 6 ? M.paceFast : M.paceNormal;
    case "final":
      return o.mealsValid ? M.final : M.error;
  }
}

interface Props {
  user: AuthUser;
  mode: OnboardingMode;
  existing: UserDoc | null;
}

export default function Onboarding({ user, mode, existing }: Props) {
  const navigate = useNavigate();
  const o = useOnboarding({
    uid: user.uid,
    username: user.username,
    mode,
    existing,
    onDone: mode === "replan" ? () => navigate("/", { replace: true }) : undefined,
  });
  const d = o.draft;
  const name = d.name.trim();
  useAvatarMood(moodFor(o, d), o.step === "bmi" ? undefined : o.step);

  // VKİ ekranı kendi animasyonunu ve "Devam" butonunu yönetir.
  if (o.step === "bmi" && o.bmi !== null && o.bmiCategory) {
    return (
      <main className="fullscreen">
        <BmiReveal label={BMI_CATEGORY_LABELS[o.bmiCategory]} bmi={o.bmi} name={name} onContinue={o.next} />
      </main>
    );
  }

  return (
    <main className="fullscreen" style={{ justifyContent: "flex-start" }}>
      <div className="row between">
        <button type="button" className="btn-icon" onClick={o.back} disabled={!o.canGoBack} aria-label="Geri">
          ‹
        </button>
        {mode === "new" ? (
          <button type="button" className="btn-text small" onClick={() => void signOut()}>
            Çıkış
          </button>
        ) : (
          <button type="button" className="btn-text small" onClick={() => navigate("/settings")}>
            Vazgeç
          </button>
        )}
      </div>
      <div className="progress" aria-hidden>
        <div style={{ width: `${o.progress * 100}%` }} />
      </div>

      <form
        key={o.step}
        className="stack-lg fade-in"
        style={{ flex: 1 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (o.step === "final") void o.finish();
          else o.next();
        }}
      >
        {o.step === "name" && (
          <label className="big-question" style={{ marginTop: "20vh" }}>
            Nasılsın{" "}
            <span style={{ whiteSpace: "nowrap" }}>
              <input
                className="input-inline"
                placeholder="adın"
                value={d.name}
                onChange={(e) => o.update("name", e.target.value)}
                maxLength={24}
                autoFocus
                aria-label="Adın"
              />
              ?
            </span>
          </label>
        )}

        {o.step === "body" && (
          <>
            <h2>Biraz seni tanıyalım{name ? `, ${name}` : ""}.</h2>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <label className="field grow">
                <span>Kilo</span>
                <div className="unit-input">
                  <input className="input" inputMode="decimal" value={d.weightKg} onChange={(e) => o.update("weightKg", e.target.value)} />
                  <em>kg</em>
                </div>
              </label>
              <label className="field grow">
                <span>Boy</span>
                <div className="unit-input">
                  <input className="input" inputMode="decimal" value={d.heightCm} onChange={(e) => o.update("heightCm", e.target.value)} />
                  <em>cm</em>
                </div>
              </label>
            </div>
            <label className="field">
              <span>Yağ oranı (biliyorsan)</span>
              <div className="unit-input">
                <input
                  className="input"
                  inputMode="decimal"
                  placeholder="Opsiyonel"
                  value={d.bodyFatPct}
                  onChange={(e) => o.update("bodyFatPct", e.target.value)}
                />
                <em>%</em>
              </div>
            </label>
            <div className="field">
              <span>Cinsiyet</span>
              <div className="segmented">
                {(
                  [
                    ["female", "Kadın"],
                    ["male", "Erkek"],
                  ] as [Sex, string][]
                ).map(([value, label]) => (
                  <button key={value} type="button" className="choice" {...onTapMood("happy")} aria-pressed={d.sex === value} onClick={() => o.update("sex", value)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="field">
              <span>Yaş</span>
              <input className="input" inputMode="numeric" value={d.age} onChange={(e) => o.update("age", e.target.value)} />
            </label>
            {o.isMinor && (
              <p className="alert">
                18 yaşından küçüksün{name ? ` ${name}` : ""}. Büyüme döneminde kilo vermek için bir doktora danışmalısın; bu
                yüzden sana kilo verme planı oluşturmayacağız.
              </p>
            )}
          </>
        )}

        {o.step === "sports" && (
          <>
            <div className="stack">
              <h2>Hangi sporları yapıyorsun, {name}?</h2>
              <p className="muted">Birden fazla ekleyebilirsin. Her antrenmanı yaklaşık 1 saat sayıyoruz.</p>
            </div>
            <SportsPicker rows={d.sports} onAdd={o.sports.add} onRemove={o.sports.remove} onChange={o.sports.change} />
          </>
        )}

        {o.step === "target" && (
          <>
            <h2>Kaç kilo olmak istiyorsun, {name}?</h2>
            {o.isMinor ? (
              <p className="note">18 yaşından küçük olduğun için hedefin şu anki kilonu korumak olacak.</p>
            ) : (
              <label className="field">
                <span>Hedef kilo (şu an {d.weightKg} kg)</span>
                <div className="unit-input">
                  <input
                    className="input"
                    inputMode="decimal"
                    value={d.targetWeightKg}
                    onChange={(e) => o.update("targetWeightKg", e.target.value)}
                    autoFocus
                  />
                  <em>kg</em>
                </div>
              </label>
            )}
          </>
        )}

        {o.step === "pace" && o.plan && (
          <>
            <Suspense fallback={<div style={{ height: 220 }} />}>
            <PaceChart
              currentKg={Number(d.weightKg.replace(",", "."))}
              targetKg={o.plan.targetWeightKg}
              days={o.plan.days}
              targetDate={o.plan.targetDate}
            />
            </Suspense>
            <p style={{ fontSize: 20, fontWeight: 600 }} aria-live="polite">
              Şu anki kilona göre ayda {o.plan.effectiveKgPerMonth.toLocaleString("tr-TR")} kilo vererek hedefine{" "}
              <span className="positive">{o.plan.days} gün</span> sonra ulaşacaksın ({formatDateTr(o.plan.targetDate)}).
            </p>
            {o.plan.notices.map((n) => (
              <p key={n} className="note small">
                {n}
              </p>
            ))}
            <div className="stack">
              {PACES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className="choice"
                  aria-pressed={d.paceKgPerMonth === p.kgPerMonth}
                  onClick={() => o.update("paceKgPerMonth", p.kgPerMonth)}
                >
                  {p.label} <span style={{ float: "right", opacity: 0.7 }}>ayda {p.kgPerMonth} kg</span>
                </button>
              ))}
            </div>
          </>
        )}

        {o.step === "final" && o.plan && o.meals && (
          <>
            <div className="stack">
              <p className="muted">Bazal metabolizman</p>
              <p className="stat-big">
                {o.plan.bmr} <span style={{ fontSize: 20 }}>kcal</span>
              </p>
              <p className="small muted">
                Bazal metabolizmana göre hesaplıyoruz; yani yaptığın sporu eklemiyoruz. Bu sayede fazladan yaktıklarını
                görmeden, fark etmeden çok daha hızlı kalori açığı verebileceksin.
              </p>
            </div>

            <div className="card card-dark stack">
              <p>Günlük hedefin</p>
              <p className="stat-big">
                {o.plan.dailyCalories} <span style={{ fontSize: 20 }}>kcal</span>
              </p>
            </div>

            <div className="stack">
              <h3>Öğünlerine böl, {name}</h3>
              <p className="small muted">Sabah, öğle ve akşam kalorini kendine göre artırıp azalt.</p>
              <MealSplitEditor meals={o.meals} dailyCalories={o.plan.dailyCalories} onChange={o.changeMeal} />
            </div>

            <p className="alert">
              {o.plan.direction === "lose"
                ? `Bu plan ${o.plan.days} gün boyunca, hedefine ulaşana kadar kilitli kalacak. Değiştiremeyeceksin.`
                : "Bu plan 30 gün boyunca kilitli kalacak. Değiştiremeyeceksin."}
            </p>
          </>
        )}

        {o.error && (
          <p className="alert" role="alert">
            {o.error}
          </p>
        )}

        <div style={{ marginTop: "auto" }}>
          <button
            type="submit"
            className={`btn btn-block ${o.step === "final" ? "btn-positive" : ""}`}
            disabled={o.saving || (o.step === "final" && !o.mealsValid)}
          >
            {o.step === "final" ? (o.saving ? "Kaydediliyor…" : `Başlayalım, ${name}`) : "Devam"}
          </button>
        </div>
      </form>
    </main>
  );
}
