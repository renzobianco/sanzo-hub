import { interpolate, useCurrentFrame } from "remotion";
import { suave } from "../marca";

export const Acento: React.FC<{ delay?: number; color: string; ancho?: number }> = ({
  delay = 0,
  color,
  ancho = 72,
}) => {
  const frame = useCurrentFrame();
  const progreso = interpolate(frame, [delay, delay + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => t, // la curva real la da `suave` vía CSS transition del ancho
  });

  return (
    <div
      style={{
        height: 2,
        width: ancho * progreso,
        backgroundColor: color,
        transitionTimingFunction: suave,
      }}
    />
  );
};
