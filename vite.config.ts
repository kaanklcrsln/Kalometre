import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Firebase SDK tek başına ~900 kB; uyarı eşiğini buna göre ayarla.
  build: { chunkSizeWarningLimit: 1000 },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
