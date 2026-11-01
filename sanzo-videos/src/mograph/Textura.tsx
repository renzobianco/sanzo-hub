import { AbsoluteFill } from "remotion";

export const Grano: React.FC<{ opacidad?: number }> = ({ opacidad = 0.05 }) => (
  <AbsoluteFill
    style={{
      opacity: opacidad,
      mixBlendMode: "overlay",
      pointerEvents: "none",
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
    }}
  />
);

export const Vineta: React.FC<{ fuerza?: number }> = ({ fuerza = 0.55 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse at center, rgba(37,29,22,0) 45%, rgba(37,29,22,${fuerza}) 100%)`,
    }}
  />
);
