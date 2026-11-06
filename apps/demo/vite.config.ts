import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@testmeman/contracts": resolve(__dirname, "../../packages/contracts/src/index.ts"),
      "@testmeman/ui/src/styles.css": resolve(__dirname, "../../packages/ui/src/styles.css"),
      "@testmeman/ui": resolve(__dirname, "../../packages/ui/src/index.ts"),
      "@testmeman/core": resolve(__dirname, "../../packages/core/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/interviews": "http://127.0.0.1:8787",
      "/problems": "http://127.0.0.1:8787",
    },
  },
});
