"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { personalizacion as config, type ColorParche, type PiezaPersonalizable } from "@/data/products";
import { defForma, medidaFinal } from "@/lib/formas";
import { familia } from "@/lib/fuentes";
import type { Grabado } from "@/lib/laser";
import { colorPorId, fuentePorId } from "@/lib/personalizacion";
import { colocar, mover, recortarZona, type Zona } from "@/lib/zonas";

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
  // Su imagen, o el nombre escrito a mano ("Tu letra"): se graba la imagen.
  if ((contenido?.modo === "imagen" || contenido?.fuente === "propia") && contenido.vista) {
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
const optimizada = (src: string, ancho: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${ancho > 1100 ? 1920 : 1080}&q=90`;

type Punto = { x: number; y: number };

/** Baja de antemano las fotos de las piezas (al abrir el editor): al cambiar de pestaña ya están. */
export function precargarPiezas(piezas: PiezaPersonalizable[]) {
  for (const p of piezas) {
    new Image().src = optimizada(p.imagen, p.tam.ancho);
    if (p.zona) new Image().src = p.zona;
  }
}

/** El parche dibujado una sola vez (memo): al arrastrarlo no se vuelve a dibujar, solo se mueve. */
const ParcheFijo = memo(function ParcheFijo({ diseno, w, h, pxCm }: { diseno: DisenoParche; w: number; h: number; pxCm: number }) {
  const color = colorPorId(diseno.color) ?? config.colores[0];
  return (
    <svg viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} className="block h-full w-full overflow-visible" aria-hidden="true">
      <Parche forma={diseno.forma} w={w} h={h} color={color} pxCm={pxCm} contenido={diseno} />
    </svg>
  );
});

/**
 * Una escena: la foto de la pieza + la zona + el parche, en HTML con transform (lo mueve la placa de video:
 * fluido en el celu). `s` = píxeles de pantalla por píxel de foto; (ox, oy) = esquina de la foto que se ve.
 */
function Escena({
  pieza,
  diseno,
  lugar,
  s,
  ox,
  oy,
  arrastrando,
  capaParche,
  capaFoto,
  oculto,
}: {
  pieza: PiezaPersonalizable;
  diseno: DisenoParche;
  lugar: { x: number; y: number; w: number; h: number };
  s: number;
  ox: number;
  oy: number;
  arrastrando: boolean;
  capaParche: React.Ref<HTMLDivElement>;
  capaFoto?: React.Ref<HTMLDivElement>;
  oculto?: boolean;
}) {
  const { imagen, tam, sinFondo, pxCm, giro = 0, zona } = pieza;
  const pw = lugar.w * s;
  const ph = lugar.h * s;
  return (
    <>
      <div ref={capaFoto} className="absolute left-0 top-0 will-change-transform" style={{ transform: `translate3d(${-ox * s}px, ${-oy * s}px, 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={optimizada(imagen, tam.ancho)}
          alt=""
          draggable={false}
          className="pointer-events-none max-w-none select-none"
          style={{ width: tam.ancho * s, height: tam.alto * s, filter: sinFondo ? "drop-shadow(0 6px 10px rgb(37 29 22 / 0.16))" : undefined }}
        />
        {zona && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={zona}
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-0 top-0 max-w-none select-none transition-opacity duration-300"
            style={{ width: tam.ancho * s, height: tam.alto * s, opacity: arrastrando ? 0.32 : 0 }}
          />
        )}
      </div>
      <div
        ref={capaParche}
        className={`pointer-events-none absolute left-0 top-0 will-change-transform ${oculto ? "hidden" : ""}`}
        style={{
          width: pw,
          height: ph,
          transform: `translate3d(${(lugar.x - ox) * s - pw / 2}px, ${(lugar.y - oy) * s - ph / 2}px, 0) rotate(${giro}deg)`,
          // Al elegir un lugar fijo el parche viaja suave; mientras se arrastra va pegado al dedo.
          transition: arrastrando ? "none" : "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div key={diseno.forma} className="parche-aparece h-full w-full">
          <div className="h-full w-full transition-transform duration-200" style={{ transform: `scale(${arrastrando ? 1.06 : 1})` }}>
            <ParcheFijo diseno={diseno} w={lugar.w} h={lugar.h} pxCm={pxCm} />
          </div>
        </div>
      </div>
    </>
  );
}

/** Ancho en pantalla de un elemento (se actualiza si cambia). */
function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho] as const;
}

/**
 * Vista previa de una pieza: la foto entera con el parche encima, a escala. El parche se arrastra con el dedo
 * (sin redibujar nada: se mueve la capa) y no se sale de la zona de la pieza (todo lo marrón de frente).
 * En piezas largas (correa, collar) abajo hay una lupa que sigue al parche.
 */
export function VistaPieza({
  pieza,
  nombrePieza,
  diseno,
  zona,
  posicion,
  onMover,
  oculto,
}: {
  pieza: PiezaPersonalizable;
  nombrePieza: string;
  diseno: DisenoParche;
  /** Pieza sin personalizar (kits con un diseño por pieza): se ve sin parche y no se arrastra. */
  oculto?: boolean;
  zona?: Zona;
  /** Dónde lo dejaron (centro, en píxeles de la foto). */
  posicion?: Punto;
  onMover: (p: Punto) => void;
}) {
  const { tam, recorte, giro = 0, lupa } = pieza;
  const vista = recorte ?? [0, 0, tam.ancho, tam.alto];
  const [marco, anchoMarco] = useAncho<HTMLDivElement>();
  const [marcoLupa, anchoLupa] = useAncho<HTMLDivElement>();
  const capaParche = useRef<HTMLDivElement>(null);
  const capaParcheLupa = useRef<HTMLDivElement>(null);
  const capaFotoLupa = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ dx: number; dy: number; desde: Punto; s: number; ox: number; oy: number } | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [movio, setMovio] = useState(false);
  const { ancho, alto } = medidaFinal(diseno.forma, diseno.ancho, diseno.alto, diseno.vista?.proporcionSilueta);
  const zonaVisible = useMemo(() => (zona ? recortarZona(zona, vista) : undefined), [zona, vista.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const lugar = colocar(pieza, ancho, alto, posicion, zonaVisible);

  // Si al cambiar forma o medida el parche tuvo que correrse para entrar, queda guardado ahí.
  useEffect(() => {
    if (!posicion || Math.abs(posicion.x - lugar.x) > 0.5 || Math.abs(posicion.y - lugar.y) > 0.5) onMover({ x: lugar.x, y: lugar.y });
  }, [lugar.x, lugar.y]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = anchoMarco ? anchoMarco / vista[2] : 0;
  // Lupa: recuadro 3:1 alrededor del parche, sin salirse de la pieza.
  const lw = Math.min(vista[2], Math.max(lugar.w * 2.6, 260));
  const lh = lw / 2;
  const encuadreLupa = (p: Punto) => ({
    x: Math.min(Math.max(p.x - lw / 2, vista[0]), vista[0] + vista[2] - lw),
    y: Math.min(Math.max(p.y - lh / 2, vista[1] - lh / 3), vista[1] + vista[3] - lh + lh / 3),
  });
  const sl = anchoLupa ? anchoLupa / lw : 0;
  const l0 = encuadreLupa(lugar);

  // Mueve las capas directo (sin React) mientras se arrastra.
  function pintar(p: Punto) {
    const pw = lugar.w * s;
    const ph = lugar.h * s;
    if (capaParche.current) capaParche.current.style.transform = `translate3d(${(p.x - vista[0]) * s - pw / 2}px, ${(p.y - vista[1]) * s - ph / 2}px, 0) rotate(${giro}deg)`;
    if (lupa && capaParcheLupa.current && capaFotoLupa.current) {
      const l = encuadreLupa(p);
      const qw = lugar.w * sl;
      const qh = lugar.h * sl;
      capaFotoLupa.current.style.transform = `translate3d(${-l.x * sl}px, ${-l.y * sl}px, 0)`;
      capaParcheLupa.current.style.transform = `translate3d(${(p.x - l.x) * sl - qw / 2}px, ${(p.y - l.y) * sl - qh / 2}px, 0) rotate(${giro}deg)`;
    }
  }

  function empezar(e: React.PointerEvent<HTMLDivElement>, escala: number, ox: number, oy: number) {
    if (!escala || oculto) return;
    const r = e.currentTarget.getBoundingClientRect();
    const p = { x: (e.clientX - r.left) / escala + ox, y: (e.clientY - r.top) / escala + oy };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Sin captura igual se arrastra.
    }
    // Se arrastra desde donde toques: el parche sigue al dedo sin saltar.
    arrastre.current = { dx: lugar.x - p.x, dy: lugar.y - p.y, desde: { x: lugar.x, y: lugar.y }, s: escala, ox, oy };
    setArrastrando(true);
  }

  function seguir(e: React.PointerEvent<HTMLDivElement>) {
    const a = arrastre.current;
    if (!a) return;
    const r = e.currentTarget.getBoundingClientRect();
    // En la lupa el encuadre se mueve con el parche: las coordenadas salen del encuadre de cuando empezó.
    const destino = { x: (e.clientX - r.left) / a.s + a.ox + a.dx, y: (e.clientY - r.top) / a.s + a.oy + a.dy };
    const nuevo = zonaVisible
      ? mover(zonaVisible, a.desde, destino, lugar.w, lugar.h, giro)
      : { x: Math.min(Math.max(destino.x, vista[0]), vista[0] + vista[2]), y: Math.min(Math.max(destino.y, vista[1]), vista[1] + vista[3]) };
    a.desde = nuevo;
    pintar(nuevo);
    if (!movio) setMovio(true);
  }

  function soltar() {
    const a = arrastre.current;
    arrastre.current = null;
    setArrastrando(false);
    if (a) onMover(a.desde);
  }

  const eventos = (escala: number, ox: number, oy: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => empezar(e, escala, ox, oy),
    onPointerMove: seguir,
    onPointerUp: soltar,
    onPointerCancel: soltar,
  });
  const cursor = arrastrando ? "cursor-grabbing" : "cursor-grab";

  return (
    <div role="img" aria-label={`Vista previa: ${nombrePieza}. Arrastrá el parche para moverlo.`} className="relative w-full">
      {/* Correa y collar: arriba, grande, la vista de cerca para mover el parche cómodo; abajo la pieza entera para ubicarse. */}
      {lupa && (
        <div
          ref={marcoLupa}
          className={`relative mb-3 w-full touch-none select-none overflow-hidden rounded-xl bg-crema/60 ring-1 ring-tinta/10 ${cursor}`}
          style={{ aspectRatio: "2 / 1" }}
          {...eventos(sl, l0.x, l0.y)}
        >
          {sl > 0 && (
            <Escena pieza={pieza} diseno={diseno} lugar={lugar} s={sl} ox={l0.x} oy={l0.y} arrastrando={arrastrando} capaParche={capaParcheLupa} capaFoto={capaFotoLupa} oculto={oculto} />
          )}
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-crema/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-tinta/60">De cerca · arrastralo acá</span>
        </div>
      )}
      <div
        ref={marco}
        className={`relative w-full touch-none select-none overflow-hidden ${cursor}`}
        style={{ aspectRatio: `${vista[2]} / ${vista[3]}` }}
        {...eventos(s, vista[0], vista[1])}
      >
        {s > 0 && <Escena pieza={pieza} diseno={diseno} lugar={lugar} s={s} ox={vista[0]} oy={vista[1]} arrastrando={arrastrando} capaParche={capaParche} oculto={oculto} />}
      </div>
      {lugar.k < 0.99 && (
        <p className="pointer-events-none mt-3 text-center text-[10px] uppercase tracking-[0.12em] text-tinta/60">
          Acá va a {String(Math.round(ancho * lugar.k * 10) / 10).replace(".", ",")} cm: lo máximo que entra
        </p>
      )}
      {!movio && lugar.k >= 0.99 && (
        <p className="pointer-events-none mt-3 text-center text-[10px] uppercase tracking-[0.12em] text-tinta/50">También podés arrastrarlo</p>
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
