import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./config/firebase";
import { applyTheme } from "./config/theme";
import App from "./App";
import { setupPlatform } from "./platform";
import "./styles.css";

// Kayıtlı temayı ilk çizimden önce uygula (açık temadan koyuya yanıp sönmesin).
applyTheme();
// Android uygulamasında geri tuşu, dış linkler ve sistem çubukları; web'de hiçbir şey yapmaz.
setupPlatform();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
