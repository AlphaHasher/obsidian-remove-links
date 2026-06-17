// eslint.config.mjs
import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  { ignores: ["main.js", "*.mjs", "jest.config.js", "removeLinks.test.ts"] },
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: "./tsconfig.json" },
    },

    // You can add your own configuration to override or add rules
    rules: {
      "obsidianmd/sample-names": "off",
      "obsidianmd/ui/sentence-case": "off",

    },
  },
]);
