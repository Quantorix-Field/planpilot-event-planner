import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "node_modules", "playwright-report", "test-results"],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      eqeqeq: ["error", "always"],
      "no-console": ["error", { allow: ["error", "warn"] }],
      "prefer-const": "error",
    },
  },
  {
    ...jsxA11y.flatConfigs.recommended,
    files: ["src/**/*.tsx"],
  },
  {
    // The dialog backdrop click is a mouse shortcut; Esc and the Cancel button
    // are the keyboard routes, so these two rules do not apply here.
    files: ["src/components/ConfirmDialog.tsx"],
    rules: {
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
