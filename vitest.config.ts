import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    include: ["packages/**/test/**/*.test.ts", "apps/**/test/**/*.test.ts"],
    environment: "node",
    allowOnly: true,
  },
  resolve: {
    alias: {
      "@testmeman/contracts": resolve("packages/contracts/src/index.ts"),
      "@testmeman/core": resolve("packages/core/src/index.ts"),
      "@testmeman/ui": resolve("packages/ui/src/index.ts"),
    },
  },
});