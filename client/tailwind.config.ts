import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        paper: "#faf9f5",
        clay: "#d97757",
        moss: "#788c5d",
        ocean: "#6a9bcc"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(31, 41, 51, 0.10)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;
