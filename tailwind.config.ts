import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
    "surface": "rgb(var(--c-surface) / <alpha-value>)",
    "surface-container": "rgb(var(--c-surface-container) / <alpha-value>)",
    "surface-high": "rgb(var(--c-surface-high) / <alpha-value>)",
    "on-surface": "rgb(var(--c-on-surface) / <alpha-value>)",
    "on-surface-variant": "rgb(var(--c-on-surface-variant) / <alpha-value>)",
    "primary": "rgb(var(--c-primary) / <alpha-value>)",
    "on-primary": "rgb(var(--c-on-primary) / <alpha-value>)",
    "primary-container": "rgb(var(--c-primary-container) / <alpha-value>)",
    "on-primary-container": "rgb(var(--c-on-primary-container) / <alpha-value>)",
    "secondary-container": "rgb(var(--c-secondary-container) / <alpha-value>)",
    "on-secondary-container": "rgb(var(--c-on-secondary-container) / <alpha-value>)",
    "tertiary": "rgb(var(--c-tertiary) / <alpha-value>)",
    "tertiary-container": "rgb(var(--c-tertiary-container) / <alpha-value>)",
    "on-tertiary-container": "rgb(var(--c-on-tertiary-container) / <alpha-value>)",
    "outline": "rgb(var(--c-outline) / <alpha-value>)",
    "outline-variant": "rgb(var(--c-outline-variant) / <alpha-value>)",
    "error": "rgb(var(--c-error) / <alpha-value>)",
    "error-container": "rgb(var(--c-error-container) / <alpha-value>)",
    "on-error-container": "rgb(var(--c-on-error-container) / <alpha-value>)",
    // nomi vecchi, per compatibilità
    carta: "rgb(var(--c-surface) / <alpha-value>)", inchiostro: "rgb(var(--c-on-surface) / <alpha-value>)", segnalibro: "rgb(var(--c-primary) / <alpha-value>)",
      },
      fontFamily: { serif: ['Charter', '"Iowan Old Style"', '"Palatino Linotype"', 'Palatino', 'Georgia', 'serif'] },
    },
  },
  plugins: [],
} satisfies Config;
