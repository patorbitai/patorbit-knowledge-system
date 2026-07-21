/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "import", "simple-import-sort"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "import/consistent-type-specifier-style": ["error", "prefer-inline"],
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
  ignorePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/*.js",
  ],
};
