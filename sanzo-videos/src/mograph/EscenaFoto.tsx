import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { grade } from "../marca";
import { Grano, Vineta } from "./Textura";

export const EscenaFoto: React.FC<{
  desde: number;
  archivo: string;
  duracion: number;
  zoomHasta?: number;
  posicion?: string;
  vineta?: number;
  children?: React.ReactNode;
}> = ({ desde, archivo, duracion, zoomHasta = 1.14, posicion = "center", vineta = 0.5, children }) => {
  const frameGlobal = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = frameGlobal - desde;

  const entrada = spring({ frame, fps, config: { damping: 22 }, durationInFrames: 14 });
  const zoom = interpolate(frame, [0, duracion], [1.0, zoomHasta]);
  const escalaEntrada = interpolate(entrada, [0, 1], [1.05, 1]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom * escalaEntrada})`, filter: grade }}>
        <Img
          src={staticFile(archivo)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: posicion }}
        />
      </AbsoluteFill>
      <Vineta fuerza={vineta} />
      {children}
      <Grano opacidad={0.06} />
    </AbsoluteFill>
  );
};
