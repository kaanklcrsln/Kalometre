import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MEAL_LABELS } from "../lib/calculations";
import type { FoodSuggestion } from "../lib/chatFood";
import type { Meal } from "../types";
import { ManualEntryForm } from "./ManualEntryForm";

interface Props {
  suggestion: FoodSuggestion;
  meal: Meal;
  saving: boolean;
  error: string | null;
  onSave: (name: string, kcal: number) => void;
  onBack: () => void;
}

/**
 * KaloAI'dan öğüne ekleme: "Kalorisini biliyorum" paneli, ad ve kalori yapay zekânın tahminiyle dolu gelir.
 * Kullanıcıya yalnızca Geri ve Devam kalır.
 */
export function ChatAddPanel({ suggestion, meal, saving, error, onSave, onBack }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onBack();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, saving]);

  // Sayfa animasyonunun transform'u sabit konumu hapsetmesin diye doğrudan body'ye çizilir.
  return createPortal(
    <div className="modal-backdrop">
      <div className="modal card stack" role="dialog" aria-modal="true" aria-labelledby="chat-add-title">
        <div className="stack" style={{ gap: 4 }}>
          <h2 id="chat-add-title">{MEAL_LABELS[meal]} öğününe ekle</h2>
          <p className="small muted">KaloAI'ın tahminiyle dolduruldu; istersen değiştir.</p>
        </div>
        <ManualEntryForm
          defaultName={suggestion.name}
          defaultKcal={suggestion.kcal}
          nameLabel="Ne yedin?"
          busy={saving}
          onSubmit={onSave}
          onCancel={onBack}
        />
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
