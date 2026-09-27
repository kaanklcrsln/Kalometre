import { useId, useState } from "react";
import {
  removeWaterRow,
  WATER_GLASS_ML,
  WATER_MAX_GLASSES,
  WATER_ROW,
  waterDeltaForGlass,
  waterGlassCount,
  waterGlassFills,
} from "../lib/calculations";

interface Props {
  waterMl: number;
  onAdd: (ml: number) => void;
}

/** Bardak dış çizgisi (yukarısı geniş, altı dar). */
const GLASS_PATH = "M5 4h30l-4.2 38.6A3 3 0 0 1 27.8 45H12.2a3 3 0 0 1-3-2.4L5 4z";

/**
 * 5'erli sıralar hâlinde bardaklar. Boş bardağa dokun +200 ml, dolu bardağa dokun −200 ml.
 * "+" 5 bardak ekler; "−" son 5 bardağı ve içlerindeki suyu kaldırır.
 */
export function WaterCounter({ waterMl, onAdd }: Props) {
  const [requested, setRequested] = useState(WATER_ROW);
  const count = waterGlassCount(waterMl, requested);
  const fills = waterGlassFills(waterMl, count);
  const liters = (waterMl / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

  const addRow = () => setRequested(Math.min(count + WATER_ROW, WATER_MAX_GLASSES));
  const removeRow = () => {
    const { glasses, deltaMl } = removeWaterRow(waterMl, count);
    setRequested(glasses);
    if (deltaMl < 0) onAdd(deltaMl);
  };

  return (
    <section className="card stack">
      <div className="row between">
        <p className="tag">Su</p>
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className="btn-icon water-step" onClick={removeRow} disabled={count <= WATER_ROW} aria-label={`${WATER_ROW} bardak çıkar`}>
            −
          </button>
          <p style={{ fontWeight: 700, minWidth: 48, textAlign: "center" }} aria-live="polite">
            {liters} L
          </p>
          <button type="button" className="btn-icon water-step" onClick={addRow} disabled={count >= WATER_MAX_GLASSES} aria-label={`${WATER_ROW} bardak ekle`}>
            +
          </button>
        </div>
      </div>
      <div className="glasses">
        {fills.map((fill, i) => (
          <Glass key={i} index={i} fill={fill} onClick={() => onAdd(waterDeltaForGlass(fill))} />
        ))}
      </div>
    </section>
  );
}

function Glass({ index, fill, onClick }: { index: number; fill: number; onClick: () => void }) {
  const clipId = useId();
  const filled = fill > 0;
  return (
    <button
      type="button"
      className="glass fade-in"
      aria-pressed={filled}
      aria-label={`${index + 1}. bardak ${filled ? `dolu, ${WATER_GLASS_ML} ml çıkar` : `boş, ${WATER_GLASS_ML} ml ekle`}`}
      onClick={onClick}
    >
      <svg viewBox="0 0 40 48" aria-hidden>
        <defs>
          <clipPath id={clipId}>
            <path d={GLASS_PATH} />
          </clipPath>
        </defs>
        {/* Su, bardağın ağzına kadar değil; alt kısımdan doluluk oranı kadar yükselir. */}
        <rect className="water" x="0" y="9" width="40" height="39" clipPath={`url(#${clipId})`} style={{ transform: `scaleY(${fill})` }} />
        <path className="outline" d={GLASS_PATH} />
      </svg>
    </button>
  );
}
