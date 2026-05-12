import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        gold: "var(--color-gold)",
        "gold-glow": "var(--color-gold-glow)",
        card: "var(--card-bg)",
        "card-border": "var(--card-border)",
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
export default config;
