import { useState } from "react";
import { CATEGORY_LABELS } from "../config/ai";
import type { MealSummary } from "../hooks/useDay";
import { MEAL_LABELS } from "../lib/calculations";
import type { NewEntry } from "../types";
import { EntryEditor } from "./EntryEditor";

interface Props {
  meals: MealSummary[];
  name: string;
  onUpdate: (id: string, patch: Partial<NewEntry>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EntryList({ meals, name, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEmpty = meals.every((m) => m.entries.length === 0);

  if (isEmpty) {
    return <p className="muted center" style={{ padding: "16px 0" }}>Henüz bir şey eklemedin, {name}. Ortadaki + ile başla.</p>;
  }

  return (
    <section className="stack-lg">
      {meals
        .filter((m) => m.entries.length > 0)
        .map((m) => (
          <div key={m.meal} className="stack">
            <div className="row between">
              <h3>{MEAL_LABELS[m.meal]}</h3>
              <span className={m.consumed > m.target ? "negative" : "muted"}>{m.consumed} kcal</span>
            </div>
            <ul className="entry-list">
              {m.entries.map((entry) => (
                <li key={entry.id}>
                  {editingId === entry.id ? (
                    <EntryEditor
                      entry={entry}
                      onSave={(patch) => onUpdate(entry.id, patch)}
                      onDelete={() => onDelete(entry.id)}
                      onClose={() => setEditingId(null)}
                    />
                  ) : (
                    <button type="button" className="entry" onClick={() => setEditingId(entry.id)}>
                      <span className="stack" style={{ gap: 2 }}>
                        <span className="tag">
                          {CATEGORY_LABELS[entry.category]}
                          {entry.editedByUser && " · düzenlendi"}
                        </span>
                        <span>{entry.items.map((i) => i.name).join(", ")}</span>
                      </span>
                      <strong style={{ whiteSpace: "nowrap" }}>{entry.totalKcal} kcal</strong>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}
