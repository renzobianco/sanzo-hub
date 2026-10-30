"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IconoCerrar } from "./Iconos";
import { trabarScroll } from "@/lib/scroll";

const MAX = 4; // acercamiento máximo
const TOQUE = 2.5; // acercamiento al tocar
const SUAVE = "transform 340ms cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * Envuelve una foto: al tocarla se abre a pantalla completa con todas las fotos del producto.
 * Tocás la foto y se acerca justo donde tocaste; con el dedo la arrastrás; pellizcando acercás o alejás;
 * otro toque la aleja.
 */
export function ConZoom({ fotos, nombre, inicial = 0, children }: { fotos: string[]; nombre: string; inicial?: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pista = useRef<HTMLUListElement>(null);
  const liberar = useRef<(() => void) | null>(null);
  useEffect(() => () => liberar.current?.(), []);
  const [activa, setActiva] = useState(inicial);
  const [acercada, setAcercada] = useState(false);
  // Las fotos grandes se montan recién al abrir: así no se piden todas al cargar la página.
  const [abierto, setAbierto] = useState(false);

  // Al abrir, arranca en la foto que se tocó.
  useEffect(() => {
    const el = pista.current;
    if (abierto && el) el.scrollLeft = inicial * el.clientWidth;
  }, [abierto, inicial]);

  if (fotos.length === 0) return <>{children}</>;

  function abrir() {
    setAcercada(false);
    setActiva(inicial);
    setAbierto(true);
    liberar.current?.();
    liberar.current = trabarScroll();
    ref.current?.showModal();
  }

  return (
    <>
      <button type="button" onClick={abrir} aria-label={`Ver de cerca: ${nombre}`} className="group/zoom relative block w-full text-left">
        {children}
        <span
          aria-hidden="true"
          className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-crema/85 text-tinta shadow-sm backdrop-blur-sm transition-transform duration-300 group-active/zoom:scale-90"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6" />
            <path d="M15 15l5 5M10.5 8v5M8 10.5h5" />
          </svg>
        </span>
      </button>

      <dialog
        ref={ref}
        aria-label={`Fotos de ${nombre}`}
        onClose={() => {
          liberar.current?.();
          liberar.current = null;
          setAbierto(false);
          setAcercada(false);
        }}
        className="m-0 h-[100dvh] max-h-none w-full max-w-none overflow-hidden bg-crema p-0 text-tinta backdrop:bg-tinta/60"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[11px] uppercase tracking-marca text-tinta/70">
              {nombre}
              {fotos.length > 1 && <span className="ml-2 tabular-nums">{activa + 1} / {fotos.length}</span>}
            </p>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar" className="-mr-2 p-2">
              <IconoCerrar />
            </button>
          </div>

          <ul
            ref={pista}
            className={`sin-scrollbar flex flex-1 snap-x snap-mandatory ${acercada ? "overflow-hidden" : "overflow-x-auto"}`}
            onScroll={(e) => {
              const el = e.currentTarget;
              setActiva(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {abierto &&
              fotos.map((src, i) => (
                <li key={src} className="relative h-full w-full shrink-0 snap-center overflow-hidden bg-lino">
                  <FotoZoom src={src} alt={`${nombre}, foto ${i + 1}`} visible={i === activa} onAcercada={setAcercada} />
                </li>
              ))}
          </ul>

          <p className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center text-[11px] uppercase tracking-amplio text-tinta/55">
            {acercada ? "Arrastrala para recorrerla · tocá para alejar" : "Tocá o pellizcá la foto para verla de cerca"}
          </p>
        </div>
      </dialog>
    </>
  );
}

/**
 * Una foto que se acerca. Todo el movimiento va directo al estilo (sin re-dibujar con React),
 * así sigue al dedo sin trabarse: arrastre 1 a 1, pellizco centrado entre los dedos y animación
 * suave solo al tocar para acercar o alejar.
 */
function FotoZoom({ src, alt, visible, onAcercada }: { src: string; alt: string; visible: boolean; onAcercada: (v: boolean) => void }) {
  const caja = useRef<HTMLDivElement>(null);
  const capa = useRef<HTMLDivElement>(null);
  const estado = useRef({ s: 1, x: 0, y: 0 }); // escala y corrimiento (origen arriba a la izquierda)
  const dedos = useRef(new Map<number, { x: number; y: number }>());
  const gesto = useRef<{ s: number; x: number; y: number; dist: number; mx: number; my: number } | null>(null);
  const toque = useRef<{ x: number; y: number; t: number; dedos: number } | null>(null);
  const cuadro = useRef(0);

  const pintar = (animar: boolean) => {
    const el = capa.current;
    if (!el) return;
    const { s, x, y } = estado.current;
    el.style.transition = animar ? SUAVE : "none";
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
  };

  // Que la foto nunca deje ver bordes vacíos: el límite es la foto (que entra "contenida"), no la pantalla.
  const limitar = () => {
    const c = caja.current;
    const img = capa.current?.querySelector("img");
    if (!c) return;
    const { s } = estado.current;
    const W = c.clientWidth, H = c.clientHeight;
    const r = img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : W / H;
    const cw = Math.min(W, H * r), ch = Math.min(H, W / r); // tamaño de la foto sin acercar
    const ox = (W - cw) / 2, oy = (H - ch) / 2; // franjas vacías a los costados / arriba y abajo
    const eje = (v: number, total: number, tam: number, borde: number) =>
      s * tam >= total ? Math.min(-s * borde, Math.max(total - s * (borde + tam), v)) : (total - s * tam) / 2 - s * borde;
    estado.current.x = eje(estado.current.x, W, cw, ox);
    estado.current.y = eje(estado.current.y, H, ch, oy);
  };

  const fijar = (s: number, x: number, y: number, animar: boolean) => {
    estado.current = { s, x, y };
    limitar();
    if (animar) pintar(true);
    else {
      cancelAnimationFrame(cuadro.current);
      cuadro.current = requestAnimationFrame(() => pintar(false));
    }
  };

  const alejar = () => {
    fijar(1, 0, 0, true);
    onAcercada(false);
  };

  // Si pasás a otra foto, esta vuelve a su tamaño.
  useEffect(() => {
    if (!visible && estado.current.s !== 1) {
      estado.current = { s: 1, x: 0, y: 0 };
      pintar(false);
    }
  }, [visible]);

  const local = (e: React.PointerEvent) => {
    const r = caja.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const empezarPellizco = () => {
    const [a, b] = [...dedos.current.values()];
    gesto.current = {
      ...estado.current,
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      mx: (a.x + b.x) / 2,
      my: (a.y + b.y) / 2,
    };
  };

  return (
    <div
      ref={caja}
      className="absolute inset-0 overflow-hidden"
      // Sin acercar, el dedo desliza entre fotos; acercada, el gesto es nuestro.
      style={{ touchAction: estado.current.s > 1 ? "none" : "pan-x" }}
      onPointerDown={(e) => {
        const p = local(e);
        dedos.current.set(e.pointerId, p);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Algunos navegadores no dejan capturar (no pasa nada: el gesto sigue igual).
        }
        toque.current = { x: e.clientX, y: e.clientY, t: Date.now(), dedos: dedos.current.size };
        if (dedos.current.size === 2) empezarPellizco();
        else gesto.current = { ...estado.current, dist: 0, mx: p.x, my: p.y };
      }}
      onPointerMove={(e) => {
        if (!dedos.current.has(e.pointerId)) return;
        const p = local(e);
        dedos.current.set(e.pointerId, p);
        const g = gesto.current;
        if (!g) return;
        if (dedos.current.size >= 2 && g.dist > 0) {
          // Pellizco: escala según la distancia entre dedos, centrado entre ellos.
          const [a, b] = [...dedos.current.values()];
          const s = Math.min(MAX, Math.max(1, (g.s * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist));
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          const lx = (g.mx - g.x) / g.s, ly = (g.my - g.y) / g.s;
          fijar(s, mx - lx * s, my - ly * s, false);
          if (s > 1) onAcercada(true);
        } else if (estado.current.s > 1) {
          // Arrastre: la foto va pegada al dedo.
          fijar(estado.current.s, g.x + (p.x - g.mx), g.y + (p.y - g.my), false);
        }
      }}
      onPointerUp={(e) => {
        dedos.current.delete(e.pointerId);
        const t = toque.current;
        if (dedos.current.size === 1) {
          // Quedó un dedo después del pellizco: sigue arrastrando desde ahí.
          const [p] = [...dedos.current.values()];
          gesto.current = { ...estado.current, dist: 0, mx: p.x, my: p.y };
          return;
        }
        gesto.current = null;
        // Toque corto, quieto y con un dedo: acerca donde tocaste o aleja.
        if (t && t.dedos === 1 && Date.now() - t.t < 350 && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 10) {
          if (estado.current.s > 1) alejar();
          else {
            const p = local(e);
            fijar(TOQUE, p.x * (1 - TOQUE), p.y * (1 - TOQUE), true);
            onAcercada(true);
          }
          return;
        }
        // Si el pellizco la dejó casi en su tamaño, vuelve sola.
        if (estado.current.s < 1.08 && estado.current.s !== 1) alejar();
      }}
      onPointerCancel={(e) => {
        dedos.current.delete(e.pointerId);
        gesto.current = null;
      }}
    >
      <div ref={capa} className="absolute inset-0 origin-top-left will-change-transform">
        <Image src={src} alt={alt} fill sizes="200vw" draggable={false} className="pointer-events-none select-none object-contain" />
      </div>
    </div>
  );
}
