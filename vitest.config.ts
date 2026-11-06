import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    include: [
      "packages/**/test/**/*.test.ts",
      "apps/**/test/**/*.test.ts",
      "**/test/**/*.test.ts",
    ],
    environment: "node",
    allowOnly: true,
  },
  resolve: {
    alias: {
      "@testmeman/contracts": resolve(rootDir, "packages/contracts/src/index.ts"),
      "@testmeman/core": resolve(rootDir, "packages/core/src/index.ts"),
      "@testmeman/ui": resolve(rootDir, "packages/ui/src/index.ts"),
    },
  },
});