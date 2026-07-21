/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./base.js"],
  rules: {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "no-console": "off",
  },
};
