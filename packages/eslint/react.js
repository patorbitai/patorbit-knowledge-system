/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "./base.js",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  plugins: ["react"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/jsx-no-target-blank": "error",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
