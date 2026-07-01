import type { Config } from "tailwindcss";
import path from "path";

const config: Config = {
  content: [
    path.join(__dirname, "./app/**/*.{ts,tsx}"),
    path.join(__dirname, "./components/**/*.{ts,tsx}"),
    path.join(__dirname, "./lib/**/*.{ts,tsx}")
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        primaryHover: "#1D4ED8",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        ink: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
        surface: "#F8FAFC"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
