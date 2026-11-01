import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colores, fuente } from "../marca";

export const Presentacion: React.FC<{ titulo: string }> = ({ titulo }) => {
  const frame = useCurrentFrame();

  const opacidad = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const traslado = interpolate(frame, [0, 20], [20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colores.crema,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: fuente,
          fontSize: 90,
          color: colores.marron,
          letterSpacing: "0.22em",
          opacity: opacidad,
          transform: `translateY(${traslado}px)`,
        }}
      >
        {titulo}
      </div>
    </AbsoluteFill>
  );
};
