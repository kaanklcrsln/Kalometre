import { useNavigate, useSearchParams } from "react-router";
import { DrinkIcon, FoodIcon, SnackIcon, WaterIcon } from "../components/Icons";
import { ManualEntryForm } from "../components/ManualEntryForm";
import { MealButtons } from "../components/MealButtons";
import { ResultCard } from "../components/ResultCard";
import { WaterForm } from "../components/WaterForm";
import type { ComponentType } from "react";
import { CATEGORY_LABELS, MAX_INPUT_CHARS } from "../config/ai";
import { useAddEntry, type AddCategory } from "../hooks/useAddEntry";
import { useSession } from "../hooks/session";
import { formatDateTr, todayKey } from "../lib/dates";

const CATEGORY_BUTTONS: { value: AddCategory; label: string; Icon: ComponentType }[] = [
  { value: "food", label: CATEGORY_LABELS.food, Icon: FoodIcon },
  { value: "drink", label: CATEGORY_LABELS.drink, Icon: DrinkIcon },
  { value: "water", label: "Su", Icon: WaterIcon },
  { value: "snack", label: CATEGORY_LABELS.snack, Icon: SnackIcon },
];

export default function AddEntry() {
  const { uid, userDoc } = useSession();
  const name = userDoc.profile.name;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const today = todayKey();
  const paramDate = params.get("date");
  const dateKey = paramDate && paramDate < today ? paramDate : today;
  const goHome = () => navigate(dateKey === today ? "/" : `/?date=${dateKey}`);

  const a = useAddEntry(uid, dateKey, goHome);

  return (
    <main className="stack-lg">
      <div className="row between">
        <button type="button" className="btn-icon" onClick={a.back} aria-label="Geri">
          ‹
        </button>
        {dateKey !== today && <span className="small muted">{formatDateTr(dateKey)} için</span>}
      </div>

      {a.step === "category" && (
        <div className="stack-lg fade-in">
          <h2>Ne ekliyorsun, {name}?</h2>
          <div className="category-grid">
            {CATEGORY_BUTTONS.map((c) => (
              <button key={c.value} type="button" className="choice" onClick={() => a.chooseCategory(c.value)}>
                <c.Icon />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {a.step === "water" && (
        <div className="stack-lg fade-in">
          <h2>Ne kadar su içtin?</h2>
          <WaterForm loading={a.loading} onSave={(ml) => void a.saveWater(ml)} />
        </div>
      )}

      {a.step === "chat" && (
        <form
          className="stack fade-in"
          onSubmit={(e) => {
            e.preventDefault();
            void a.submit();
          }}
        >
          <h2>{CATEGORY_LABELS[a.category]}</h2>
          <textarea
            className="textarea"
            rows={4}
            value={a.text}
            maxLength={MAX_INPUT_CHARS}
            onChange={(e) => a.setText(e.target.value)}
            placeholder={
              a.category === "drink" ? "Ne içtiğini ve ne kadar içtiğini tarif et…" : "Ne yediğini ve ne kadar yediğini tarif et…"
            }
            disabled={a.loading}
            autoFocus
          />
          <button type="submit" className="btn btn-block" disabled={a.loading || !a.text.trim()}>
            {a.loading ? "Hesaplanıyor…" : "Gönder"}
          </button>
          {a.loading ? (
            <div className="row center" style={{ justifyContent: "center" }} aria-live="polite">
              <div className="spinner" />
              <span className="muted">Kaloriler hesaplanıyor…</span>
            </div>
          ) : (
            // Kalorisi biliniyorsa yapay zekâ çalıştırılmadan doğrudan girilir.
            <button type="button" className="btn btn-ghost btn-block" onClick={a.openManual}>
              Kalorisini biliyorum
            </button>
          )}
        </form>
      )}

      {a.step === "result" && (
        <ResultCard
          items={a.items}
          assumptions={a.assumptions}
          total={a.total}
          onKcalChange={a.setItemKcal}
          onReject={a.reject}
          onAccept={a.accept}
        />
      )}

      {a.step === "manual" && (
        <div className="stack-lg fade-in">
          <h2>Kaloriyi elle gir</h2>
          <ManualEntryForm
            defaultName={a.text.trim()}
            nameLabel={a.category === "drink" ? "Ne içtin?" : "Ne yedin?"}
            onSubmit={a.saveManual}
            onCancel={a.back}
          />
        </div>
      )}

      {a.step === "meal" && (
        <div className="stack-lg center fade-in">
          <div className="stack center" style={{ gap: 4 }}>
            <h2>Hangi öğün?</h2>
            <p className="muted">{a.total} kcal</p>
          </div>
          <MealButtons variant="big" value={a.meal} onChange={a.setMeal} />
          <button type="button" className="btn btn-positive btn-block" onClick={() => void a.save()} disabled={a.loading}>
            {a.loading ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      )}

      {a.error && (
        <div className="alert stack" role="alert">
          <span>{a.error}</span>
          {a.canEnterManually && (
            <button type="button" className="btn btn-ghost" onClick={a.openManual}>
              Kaloriyi elle gir
            </button>
          )}
        </div>
      )}
    </main>
  );
}
