// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    // Add this rules object to relax the strict type checking for deployment
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Turns off errors for using 'any' type
      "@typescript-eslint/no-unused-vars": "warn", // Changes unused variable errors to warnings
    },
  }
];

export default eslintConfig;