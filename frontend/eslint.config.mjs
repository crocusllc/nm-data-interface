// ESLint flat config for Next.js
// Using a minimal config to avoid parser serialization issues
export default [
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Basic Next.js recommended rules without parser dependencies
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "warn",
    },
  },
];
