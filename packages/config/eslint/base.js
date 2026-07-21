{
  "$schema": "https://json.schemastore.org/eslintrc",
  "root": true,
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  "plugins": ["@typescript-eslint"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": true
  },
  "rules": {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
