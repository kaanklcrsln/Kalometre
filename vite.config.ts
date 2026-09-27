import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Windows'ta bir dosyaya art arda hızlı yazılınca izleyici ara hâli (yarım/boş dosya) önbelleğe alıp
    // son değişikliği kaçırabiliyordu. Dosya boyutu 150 ms sabit kalana kadar beklenir.
    watch: { awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 } },
  },
  // Firebase SDK tek başına ~900 kB; uyarı eşiğini buna göre ayarla.
  build: { chunkSizeWarningLimit: 1000 },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
