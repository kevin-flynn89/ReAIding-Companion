import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: { colors: { carta: "#EEF1F6", inchiostro: "#14213D", segnalibro: "#0F8B8D" } } },
  plugins: [],
} satisfies Config;
