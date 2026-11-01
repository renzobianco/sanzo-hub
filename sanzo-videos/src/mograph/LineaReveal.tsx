import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fuente } from "../marca";

// Reveal con máscara: la línea entra tapada y se desliza a su lugar,
// igual que la animación "subir" que ya usa sanzo-web para sus textos.
export const LineaReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  tamano?: number;
  color: string;
  peso?: number;
  tracking?: string;
}> = ({ children, delay = 0, tamano = 60, color, peso = 500, tracking = "0" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progreso = spring({
    frame: frame - delay,
    fps,
    config: { damping: 26, mass: 0.9 },
    durationInFrames: 22,
  });
  const y = (1 - progreso) * 110;

  return (
    <div style={{ overflow: "hidden" }}>
      <div
        style={{
          transform: `translateY(${y}%)`,
          fontFamily: fuente,
          fontSize: tamano,
          fontWeight: peso,
          lineHeight: 1.08,
          color,
          letterSpacing: tracking,
        }}
      >
        {children}
      </div>
    </div>
  );
};
