import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colores, fuente } from "../marca";

const Grano: React.FC<{ opacidad?: number }> = ({ opacidad = 0.05 }) => (
  <AbsoluteFill
    style={{
      opacity: opacidad,
      mixBlendMode: "overlay",
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
    }}
  />
);

const EscenaLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrada = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 30 });
  const salida = interpolate(frame, [55, 70], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colores.crema,
        justifyContent: "center",
        alignItems: "center",
        opacity: salida,
      }}
    >
      <Img
        src={staticFile("logo_sanzo.png")}
        style={{
          width: 260,
          opacity: entrada,
          transform: `scale(${interpolate(entrada, [0, 1], [0.92, 1])})`,
        }}
      />
      <div
        style={{
          marginTop: 28,
          fontFamily: fuente,
          fontSize: 20,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: colores.topo,
          opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: "clamp" }),
        }}
      >
        Accesorios para mascotas
      </div>
      <Grano />
    </AbsoluteFill>
  );
};

const EscenaFoto: React.FC<{ desde: number }> = ({ desde }) => {
  const frame = useCurrentFrame() - desde;
  const zoom = interpolate(frame, [0, 150], [1, 1.12], { extrapolateRight: "clamp" });
  const entrada = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp" });
  const textoY = interpolate(frame, [20, 45], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: entrada, backgroundColor: colores.tinta }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Img
          src={staticFile("foto_portada.jpeg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(37,29,22,0.85) 0%, rgba(37,29,22,0.15) 45%, rgba(37,29,22,0) 70%)",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 90px 170px" }}>
        <div
          style={{
            fontFamily: fuente,
            fontSize: 64,
            lineHeight: 1.05,
            color: colores.crema,
            letterSpacing: "0.01em",
            transform: `translateY(${textoY}px)`,
            opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp" }),
          }}
        >
          Para que salga
          <br />
          con onda.
        </div>
      </AbsoluteFill>
      <Grano opacidad={0.07} />
    </AbsoluteFill>
  );
};

const EscenaCierre: React.FC<{ desde: number }> = ({ desde }) => {
  const frame = useCurrentFrame() - desde;
  const entrada = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colores.marron,
        justifyContent: "center",
        alignItems: "center",
        opacity: entrada,
      }}
    >
      <div
        style={{
          fontFamily: fuente,
          fontSize: 34,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: colores.crema,
          transform: `translateY(${interpolate(frame, [0, 20], [16, 0], { extrapolateLeft: "clamp" })}px)`,
        }}
      >
        sanzo
      </div>
      <Grano opacidad={0.05} />
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colores.tinta }}>
      <Sequence from={0} durationInFrames={70}>
        <EscenaLogo />
      </Sequence>
      <Sequence from={55} durationInFrames={160}>
        <EscenaFoto desde={55} />
      </Sequence>
      <Sequence from={195} durationInFrames={45}>
        <EscenaCierre desde={195} />
      </Sequence>
    </AbsoluteFill>
  );
};
