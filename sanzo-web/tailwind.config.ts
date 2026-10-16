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
      transitionTimingFunction: {
        suave: "cubic-bezier(0.16, 1, 0.3, 1)",
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
        subir: {
          from: { transform: "translateY(110%)" },
          to: { transform: "translateY(0)" },
        },
        zoomLento: {
          from: { transform: "scale(1.08)" },
          to: { transform: "scale(1)" },
        },
        cinta: {
          to: { transform: "translateX(-50%)" },
        },
        bajar: {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "45%": { transform: "scaleY(1)", transformOrigin: "top" },
          "55%": { transform: "scaleY(1)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
        balanceo: {
          "0%, 100%": { transform: "rotate(-1.2deg) translateY(0)" },
          "50%": { transform: "rotate(1.2deg) translateY(-3px)" },
        },
      },
      animation: {
        entrada: "entrada 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        balanceo: "balanceo 6s ease-in-out infinite",
        subir: "subir 1.1s cubic-bezier(0.16, 1, 0.3, 1) both",
        "zoom-lento": "zoomLento 14s cubic-bezier(0.22, 1, 0.36, 1) both",
        cinta: "cinta 32s linear infinite",
        bajar: "bajar 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
