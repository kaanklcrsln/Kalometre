// Yalnızca Android uygulamasında yüklenir (bkz. platform/index.ts).

import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { SystemBars, SystemBarsStyle } from "@capacitor/core";
import { getTheme, subscribeTheme } from "../config/theme";

/**
 * Donanım geri tuşu:
 * 1. Açık bir panel varsa (kullanıcılar, günlük hedef, öğüne ekle) Esc gibi kapatır; paneller Esc'i zaten dinliyor.
 * 2. Geçmiş varsa bir önceki sayfaya döner.
 * 3. İlk sayfadaysa uygulamadan çıkar.
 */
function handleBackButton() {
  void App.addListener("backButton", ({ canGoBack }) => {
    if (document.querySelector(".modal-backdrop")) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    } else if (canGoBack) {
      window.history.back();
    } else {
      void App.exitApp();
    }
  });
}

/** Yeni sekmede açılan linkler (GitHub, lisans) WebView'da değil, uygulama içi tarayıcıda açılır. */
function handleExternalLinks() {
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as Element | null)?.closest?.("a[target=_blank]") as HTMLAnchorElement | null;
      if (!a?.href) return;
      e.preventDefault();
      void Browser.open({ url: a.href });
    },
    true,
  );
}

/** Durum ve gezinme çubuğu simgeleri temaya uysun: açık temada koyu simge, koyu temada açık simge. */
function syncSystemBars() {
  const apply = () => void SystemBars.setStyle({ style: getTheme() === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light });
  apply();
  subscribeTheme(apply);
}

export function setupAndroid(): void {
  document.documentElement.classList.add("native");
  handleBackButton();
  handleExternalLinks();
  syncSystemBars();
}
