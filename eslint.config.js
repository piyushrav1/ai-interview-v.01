import js from "@eslint/js";
import ts from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    ignores: ["node_modules/", "dist/", "**/dist/**", "**/*.config.js", "prettier.config.js"],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "off",
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
