import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        marron: token("marron"),
        topo: token("topo"),
        crema: token("crema"),
        lino: token("lino"),
        tinta: token("tinta"),
      },
      fontFamily: {
        sans: ["var(--font-jost)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        marca: "0.22em",
        amplio: "0.32em",
      },
      keyframes: {
        entrada: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        giro: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        entrada: "entrada 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        giro: "giro 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
