import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
// import turboConfig from "eslint-config-turbo/flat";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  // ...turboConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  // {
  //   rules: {
  //     "turbo/no-undeclared-env-vars": "warn",
  //   },
  // },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
];
