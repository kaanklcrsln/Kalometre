import { useSearchParams } from "react-router";
import { addDaysToKey, todayKey } from "../lib/dates";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Seçili gün URL'de (?date=yyyy-mm-dd) tutulur; gelecek günlere izin verilmez. */
export function useSelectedDate() {
  const [params, setParams] = useSearchParams();
  const today = todayKey();
  const raw = params.get("date");
  const dateKey = raw && DATE_RE.test(raw) && raw <= today ? raw : today;

  const setDate = (key: string) => {
    if (key >= today) setParams({}, { replace: true });
    else setParams({ date: key }, { replace: true });
  };

  return {
    dateKey,
    isToday: dateKey === today,
    prev: () => setDate(addDaysToKey(dateKey, -1)),
    next: () => setDate(addDaysToKey(dateKey, 1)),
    goToday: () => setDate(today),
  };
}
