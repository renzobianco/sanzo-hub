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
        girar: {
          to: { transform: "rotate(360deg)" },
        },
        brillo: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(500%)" },
        },
        fundido: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
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
        cintaDerecha: {
          from: { transform: "translateX(-50%)" },
          to: { transform: "translateX(0)" },
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
        salto: {
          "0%, 100%": { transform: "translateY(0) rotate(0)" },
          "30%": { transform: "translateY(-6px) rotate(-8deg)" },
          "60%": { transform: "translateY(0) rotate(5deg)" },
          "80%": { transform: "translateY(-2px) rotate(-2deg)" },
        },
        pop: {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "60%": { transform: "scale(1.25)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        flotar: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        respirar: {
          from: { transform: "scale(1)" },
          to: { transform: "scale(1.08)" },
        },
        balanceo: {
          "0%, 100%": { transform: "rotate(-1.2deg) translateY(0)" },
          "50%": { transform: "rotate(1.2deg) translateY(-3px)" },
        },
        resplandor: {
          "0%, 100%": { boxShadow: "0 16px 34px -14px rgb(var(--marron) / 0.6)" },
          "50%": { boxShadow: "0 20px 48px -10px rgb(var(--marron) / 0.95)" },
        },
      },
      animation: {
        entrada: "entrada 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        fundido: "fundido 0.7s ease both",
        brillo: "brillo 5s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        resplandor: "resplandor 2.4s ease-in-out infinite",
        balanceo: "balanceo 6s ease-in-out infinite",
        respirar: "respirar 9s ease-in-out infinite alternate",
        salto: "salto 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        pop: "pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        flotar: "flotar 4s ease-in-out infinite",
        "cinta-lenta": "cinta 60s linear infinite",
        subir: "subir 1.1s cubic-bezier(0.16, 1, 0.3, 1) both",
        "zoom-lento": "zoomLento 14s cubic-bezier(0.22, 1, 0.36, 1) both",
        cinta: "cinta 32s linear infinite",
        "cinta-derecha": "cintaDerecha 70s linear infinite",
        bajar: "bajar 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        "girar-lento": "girar 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
