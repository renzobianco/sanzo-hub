import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colores, fuente, grade } from "../marca";
import { Grano, Vineta } from "../mograph/Textura";
import { FlashCut } from "../mograph/FlashCut";
import { LineaReveal } from "../mograph/LineaReveal";
import { Acento } from "../mograph/Acento";
import { EscenaFoto } from "../mograph/EscenaFoto";

// Escena 1 — detalle en macro, cold open. Genera intriga antes de mostrar nada más.
const EscenaDetalle: React.FC<{ desde: number; duracion: number }> = ({ desde, duracion }) => {
  const frame = useCurrentFrame() - desde;
  const zoom = interpolate(frame, [0, duracion], [1.08, 1.22]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, filter: `${grade} brightness(0.8)` }}>
        <Img
          src={staticFile("detalle.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "60% 40%" }}
        />
      </AbsoluteFill>
      <Vineta fuerza={0.65} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 64px 64px" }}>
        <div
          style={{
            fontFamily: fuente,
            fontSize: 16,
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            color: colores.lino,
            opacity: interpolate(frame, [20, 40], [0, 0.75], { extrapolateLeft: "clamp" }),
          }}
        >
          sanzo
        </div>
      </AbsoluteFill>
      <Grano opacidad={0.08} />
    </AbsoluteFill>
  );
};

// Escena final — logo real (nunca recreado) + tagline.
const EscenaLogo: React.FC<{ desde: number }> = ({ desde }) => {
  const frameGlobal = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = frameGlobal - desde;

  const entrada = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 28 });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colores.crema,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Img
        src={staticFile("logo-sanzo.png")}
        style={{
          width: 320,
          opacity: entrada,
          transform: `scale(${interpolate(entrada, [0, 1], [0.94, 1])})`,
        }}
      />
      <div style={{ height: 22 }} />
      <div
        style={{
          opacity: interpolate(frame, [18, 34], [0, 1], { extrapolateLeft: "clamp" }),
          transform: `translateY(${interpolate(frame, [18, 34], [8, 0], { extrapolateLeft: "clamp" })}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fuente,
            fontSize: 17,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: colores.topo,
          }}
        >
          Accesorios para mascotas
        </div>
      </div>
      <Grano opacidad={0.04} />
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colores.tinta }}>
      <Sequence from={0} durationInFrames={65}>
        <EscenaDetalle desde={0} duracion={65} />
      </Sequence>

      <Sequence from={55} durationInFrames={115}>
        <EscenaFoto desde={55} archivo="hero-lifestyle.jpg" duracion={110} posicion="50% 30%" vineta={0.45}>
          <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 64px 150px" }}>
            <LineaReveal delay={20} tamano={66} color={colores.crema} peso={600}>
              Para que salga
            </LineaReveal>
            <LineaReveal delay={28} tamano={66} color={colores.crema} peso={600}>
              con onda.
            </LineaReveal>
            <div style={{ height: 18 }} />
            <Acento delay={42} color={colores.marron} />
          </AbsoluteFill>
        </EscenaFoto>
      </Sequence>

      <Sequence from={160} durationInFrames={65}>
        <EscenaFoto desde={160} archivo="hero-alegria.jpg" duracion={60} zoomHasta={1.08} posicion="50% 35%" vineta={0.4}>
          <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 64px 150px" }}>
            <LineaReveal delay={10} tamano={66} color={colores.crema} peso={600}>
              Y se note.
            </LineaReveal>
          </AbsoluteFill>
        </EscenaFoto>
      </Sequence>

      <Sequence from={215} durationInFrames={65}>
        <EscenaFoto desde={215} archivo="puerta.jpg" duracion={65} zoomHasta={1.1} posicion="50% 45%" vineta={0.55}>
          <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 64px 150px" }}>
            <LineaReveal delay={14} tamano={48} color={colores.lino} peso={500}>
              Siempre vuelve
            </LineaReveal>
            <LineaReveal delay={22} tamano={48} color={colores.lino} peso={500}>
              a casa.
            </LineaReveal>
          </AbsoluteFill>
        </EscenaFoto>
      </Sequence>

      <Sequence from={270} durationInFrames={70}>
        <EscenaLogo desde={270} />
      </Sequence>

      <FlashCut enFrame={55} />
      <FlashCut enFrame={160} />
      <FlashCut enFrame={215} color={colores.tinta} />
      <FlashCut enFrame={270} />
    </AbsoluteFill>
  );
};
