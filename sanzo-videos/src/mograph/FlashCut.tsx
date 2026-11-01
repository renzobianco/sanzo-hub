import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colores } from "../marca";

// Flash de color sobre un corte, para que el cambio de escena se sienta
// a propósito (como un whip-cut) en vez de un corte seco.
export const FlashCut: React.FC<{ enFrame: number; color?: string }> = ({
  enFrame,
  color = colores.crema,
}) => {
  const frame = useCurrentFrame();
  const opacidad = interpolate(
    frame,
    [enFrame - 5, enFrame - 1, enFrame + 1, enFrame + 7],
    [0, 0.92, 0.92, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (opacidad <= 0) return null;

  return (
    <AbsoluteFill
      style={{ backgroundColor: color, opacity: opacidad, pointerEvents: "none" }}
    />
  );
};
