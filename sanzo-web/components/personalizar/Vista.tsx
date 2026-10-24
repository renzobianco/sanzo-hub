"use client";

import { useEffect, useId, useState } from "react";
import { personalizacion as config, type ColorParche, type PiezaPersonalizable } from "@/data/products";
import { defForma, medidaFinal } from "@/lib/formas";
import { familia } from "@/lib/fuentes";
import type { Grabado } from "@/lib/laser";
import { colorPorId, fuentePorId } from "@/lib/personalizacion";

/** Lo que define cómo se ve el parche (lo mismo que se elige en el editor). */
export interface DisenoParche {
  forma: string;
  color: string;
  /** En cm. */
  ancho: number;
  alto: number;
  modo: "nombre" | "imagen";
  nombre: string;
  telefono: string;
  fuente: string;
  vista?: Grabado;
}

/** Ancho del texto en una letra cargada (medido de verdad con canvas; se vuelve a medir cuando termina de bajar la letra). */
function useAnchoTexto(texto: string, fam: string, peso: number, espaciado: number) {
  const [, setCargada] = useState(0);
  const resuelta = useResolverFamilia(fam);
  useEffect(() => {
    if (!resuelta || !document.fonts) return;
    let vivo = true;
    document.fonts.load(`${peso} 100px ${resuelta}`, texto).then(() => vivo && setCargada((x) => x + 1));
    return () => {
      vivo = false;
    };
  }, [resuelta, peso, texto]);
  if (typeof document === "undefined" || !resuelta) return texto.length * 62;
  const ctx = lienzoMedidas();
  if (!ctx) return texto.length * 62;
  ctx.font = `${peso} 100px ${resuelta}`;
  return ctx.measureText(texto).width + Math.max(0, texto.length - 1) * espaciado * 100;
}

let ctxMedidas: CanvasRenderingContext2D | null | undefined;
function lienzoMedidas() {
  if (ctxMedidas === undefined) ctxMedidas = document.createElement("canvas").getContext("2d");
  return ctxMedidas;
}

/** canvas no entiende var(--font-jost): la paso a su nombre real. */
function useResolverFamilia(fam: string) {
  const [resuelta, setResuelta] = useState("");
  useEffect(() => {
    setResuelta(
      fam.replace(/var\((--[\w-]+)\)/g, (_, v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "sans-serif"),
    );
  }, [fam]);
  return resuelta;
}

/** Nombre (y teléfono) grabados, achicados para que entren en la zona. */
function TextoGrabado({ ancho, alto, dy, nombre, telefono, fuente, color }: { ancho: number; alto: number; dy: number; nombre: string; telefono: string; fuente: string; color: string }) {
  const f = fuentePorId(fuente);
  const { familia: fam, peso } = familia(fuente);
  const vacio = !nombre.trim();
  const base = nombre.trim() || "Nombre";
  const texto = f?.mayusculas ? base.toUpperCase() : base;
  const esp = f?.mayusculas ? 0.08 : 0.01;
  const tel = telefono.trim();
  const medida = useAnchoTexto(texto, fam, peso, esp);
  const medidaTel = useAnchoTexto(tel || "0", fam, peso, 0.04);
  const tamNombre = Math.min(alto * (tel ? 0.56 : 0.8), (ancho / medida) * 100);
  const tamTel = Math.min(alto * 0.28, (ancho / medidaTel) * 100);
  const yNombre = dy + (tel ? -alto * 0.16 : 0);
  const yTel = dy + alto * 0.3;

  const capa = (desplazo: number, fill: string, opacidad: number) => (
    <g transform={`translate(0 ${desplazo})`} fill={fill} fillOpacity={opacidad}>
      <text y={yNombre} fontSize={tamNombre} letterSpacing={`${esp}em`}>
        {texto}
      </text>
      {tel && (
        <text y={yTel} fontSize={tamTel} letterSpacing="0.04em">
          {tel}
        </text>
      )}
    </g>
  );

  return (
    <g textAnchor="middle" dominantBaseline="central" style={{ fontFamily: fam, fontWeight: peso }}>
      {/* Luz en el borde de abajo: el láser hunde apenas la cuerina. */}
      {!vacio && capa(Math.max(0.4, tamNombre * 0.03), "#fff", 0.16)}
      {capa(0, color, vacio ? 0.3 : 0.92)}
    </g>
  );
}

/**
 * El parche: forma recortada en cuerina (con grano, veteado y un brillo suave), canto quemado por el láser
 * y el grabado encima. Centrado en (0, 0), w × h en las unidades de quien lo usa. pxCm: cuántas unidades es 1 cm.
 */
export function Parche({ forma, w, h, color, pxCm, contenido }: { forma: string; w: number; h: number; color: ColorParche; pxCm: number; contenido?: Omit<DisenoParche, "forma" | "color" | "ancho" | "alto"> }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const def = defForma(forma);
  const canto = Math.max(0.5, pxCm * 0.025);
  const silueta = forma === "silueta" && contenido?.vista;
  const veteado = color.veteado ?? 0.2;
  const rojo = parseInt(color.color.slice(1, 3), 16);
  const claro = rojo > 200;
  const oscuro = rojo < 60;
  const caja = { x: -w / 2, y: -h / 2, width: w, height: h };

  // La forma como máscara: un trazo o, en "Su silueta", el contorno de la imagen.
  const forma2 = (escala: number, id: string) => (
    <mask id={id} maskUnits="userSpaceOnUse" x={-w} y={-h} width={w * 2} height={h * 2}>
      {silueta ? (
        <image
          href={contenido!.vista!.silueta}
          x={(-w / 2) * escala}
          y={(-h / 2) * escala}
          width={w * escala}
          height={h * escala}
          preserveAspectRatio="none"
          filter={`url(#${uid}afilar)`}
        />
      ) : (
        <path d={def.trazo(w * escala, h * escala)} fill="#fff" />
      )}
    </mask>
  );
  const escalaCara = Math.max(0.5, 1 - (canto * 2) / Math.min(w, h));

  let grabado: React.ReactNode = null;
  if (contenido?.modo === "imagen" && contenido.vista) {
    const v = contenido.vista;
    // En la silueta el grabado ocupa todo menos el margen; en las demás, entra en la zona de la forma.
    let gw: number, gh: number, gy = 0;
    if (silueta) {
      gw = w * (1 - v.margen.x * 2);
      gh = h * (1 - v.margen.y * 2);
    } else {
      const zw = w * def.imagen.ancho;
      const zh = h * def.imagen.alto;
      gy = h * (def.imagen.dy ?? 0);
      [gw, gh] = zw / zh > v.proporcion ? [zh * v.proporcion, zh] : [zw, zw / v.proporcion];
    }
    const img = (dy: number) => (
      <mask id={`${uid}img${dy ? "l" : ""}`} maskUnits="userSpaceOnUse" x={-w} y={-h} width={w * 2} height={h * 2}>
        <image href={v.grabado} x={-gw / 2} y={gy - gh / 2 + dy} width={gw} height={gh} preserveAspectRatio="none" />
      </mask>
    );
    const luz = Math.max(0.4, pxCm * 0.02);
    grabado = (
      <>
        <defs>
          {img(0)}
          {img(luz)}
        </defs>
        <rect {...caja} fill="#fff" fillOpacity={0.14} mask={`url(#${uid}imgl)`} />
        <rect {...caja} fill={color.grabado} mask={`url(#${uid}img)`} style={{ transition: "fill 0.4s" }} />
      </>
    );
  } else if (contenido?.modo === "nombre") {
    grabado = (
      <TextoGrabado
        ancho={w * def.texto.ancho}
        alto={h * def.texto.alto}
        dy={h * (def.texto.dy ?? 0)}
        nombre={contenido.nombre}
        telefono={contenido.telefono}
        fuente={contenido.fuente}
        color={color.grabado}
      />
    );
  }

  return (
    <g>
      <defs>
        <filter id={`${uid}afilar`}>
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
        </filter>
        {forma2(1, `${uid}borde`)}
        {forma2(escalaCara, `${uid}cara`)}
        {/* Grano de la cuerina: relieve con luz rasante. */}
        <filter id={`${uid}grano`} x={caja.x} y={caja.y} width={w} height={h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency={1 / (pxCm * 0.13)} numOctaves={3} seed={7} result="n" />
          <feDiffuseLighting in="n" surfaceScale={pxCm * 0.035} lightingColor="#fff">
            <feDistantLight azimuth={235} elevation={58} />
          </feDiffuseLighting>
        </filter>
        {/* Veteado: manchas grandes más oscuras (el marrón envejecido). */}
        <filter id={`${uid}vetas`} x={caja.x} y={caja.y} width={w} height={h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency={1 / (pxCm * 1.4)} numOctaves={4} seed={3} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.05  0 0 0 0 0.02  1.6 0 0 0 -0.55" />
        </filter>
        <linearGradient id={`${uid}brillo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={claro ? 0.25 : 0.2} />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={claro ? 0.06 : 0.14} />
        </linearGradient>
      </defs>

      {/* Sombra corta: va pegado, casi sin volumen. */}
      <g style={{ filter: `drop-shadow(0 ${Math.max(0.5, pxCm * 0.03)}px ${Math.max(0.6, pxCm * 0.05)}px rgb(37 29 22 / 0.35))` }}>
        <rect {...caja} fill={color.borde} mask={`url(#${uid}borde)`} style={{ transition: "fill 0.4s" }} />
      </g>
      <g mask={`url(#${uid}cara)`}>
        <rect {...caja} fill={color.color} style={{ transition: "fill 0.4s" }} />
        <rect {...caja} filter={`url(#${uid}vetas)`} opacity={veteado} style={{ mixBlendMode: "multiply" }} />
        <rect {...caja} filter={`url(#${uid}grano)`} opacity={claro ? 0.35 : oscuro ? 0.3 : 0.5} style={{ mixBlendMode: "soft-light" }} />
        <rect {...caja} fill={`url(#${uid}brillo)`} />
        {grabado}
      </g>
    </g>
  );
}

/** Versión optimizada de una foto de /public (la misma que arma next/image). */
const optimizada = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;

/**
 * Vista previa de una pieza: la foto del artículo con el parche encima, en su lugar y a escala
 * (si el parche no entra en esta pieza, se achica a lo que entra). Todo en un SVG con las medidas de la foto.
 */
export function VistaPieza({ pieza, nombrePieza, diseno }: { pieza: PiezaPersonalizable; nombrePieza: string; diseno: DisenoParche }) {
  const { imagen: foto, tam, recorte, fondoBlanco, parche, cm } = pieza;
  const vista = recorte ?? [0, 0, tam.ancho, tam.alto];
  const pxCm = parche.ancho / cm.ancho;
  const { ancho, alto } = medidaFinal(diseno.forma, diseno.ancho, diseno.alto, diseno.vista?.proporcionSilueta);
  const k = Math.min(1, cm.ancho / ancho, cm.alto / alto);
  const color = colorPorId(diseno.color) ?? config.colores[0];

  return (
    <div role="img" aria-label={`Vista previa: ${nombrePieza}`} className="relative aspect-[4/5] w-full overflow-hidden bg-lino">
      <svg viewBox={vista.join(" ")} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* Fondo lino dentro del SVG: el multiply de la foto se mezcla con esto y el blanco desaparece. */}
        <rect x={-tam.ancho} y={-tam.alto} width={tam.ancho * 3} height={tam.alto * 3} fill="rgb(var(--lino))" />
        <image
          href={optimizada(foto)}
          width={tam.ancho}
          height={tam.alto}
          style={fondoBlanco ? { mixBlendMode: "multiply", filter: "brightness(1.1) contrast(1.05)" } : undefined}
        />
        <g transform={`translate(${parche.x} ${parche.y}) rotate(${parche.giro ?? 0})`}>
          {/* key: al cambiar de forma aparece de nuevo con un pequeño rebote. */}
          <g key={diseno.forma} className="parche-aparece">
            <Parche forma={diseno.forma} w={ancho * k * pxCm} h={alto * k * pxCm} color={color} pxCm={pxCm} contenido={diseno} />
          </g>
        </g>
      </svg>
      {k < 0.99 && (
        <p className="absolute inset-x-0 bottom-2 text-center text-[10px] uppercase tracking-[0.12em] text-tinta/60">
          En esta pieza va a {String(Math.round(ancho * k * 10) / 10).replace(".", ",")} cm: lo máximo que entra
        </p>
      )}
    </div>
  );
}

/** El parche diseñado solo, sin la pieza (resumen en el carrito y en "Personalizado"). */
export function ParcheSolo({ diseno, className = "h-12 w-20" }: { diseno: DisenoParche; className?: string }) {
  const { ancho, alto } = medidaFinal(diseno.forma, diseno.ancho, diseno.alto, diseno.vista?.proporcionSilueta);
  const color = colorPorId(diseno.color) ?? config.colores[0];
  const pxCm = 10;
  const m = 4;
  return (
    <svg viewBox={`${-ancho * 5 - m} ${-alto * 5 - m} ${ancho * pxCm + m * 2} ${alto * pxCm + m * 2}`} className={className} aria-hidden="true">
      <Parche forma={diseno.forma} w={ancho * pxCm} h={alto * pxCm} color={color} pxCm={pxCm} contenido={diseno} />
    </svg>
  );
}

/** La forma sola, para los botones de forma. */
export function MiniForma({ forma, color, vista }: { forma: string; color: ColorParche; vista?: Grabado }) {
  const p = forma === "silueta" ? vista?.proporcionSilueta ?? 1 : defForma(forma).proporcion ?? 2;
  const [w, h] = p >= 1 ? [80, 80 / p] : [80 * p, 80];
  return (
    <svg viewBox="-50 -50 100 100" className="h-12 w-full" aria-hidden="true">
      <Parche forma={forma} w={w} h={h} color={color} pxCm={12} contenido={forma === "silueta" && vista ? { modo: "imagen", nombre: "", telefono: "", fuente: "", vista } : undefined} />
    </svg>
  );
}
