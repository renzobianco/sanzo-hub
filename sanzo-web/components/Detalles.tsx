"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { detallesDe, type Detalle } from "@/data/detalles";

/** Largo del tramo recto que entra a la etiqueta (en % de la foto). */
const TRAMO = 4;

/** La etiqueta sale siempre del lado contrario al puntito: la línea nunca la cruza. */
const lado = (p: Detalle) => (p.tx >= p.x ? 1 : -1);

/**
 * Detalles señalados sobre la foto (estilo ficha técnica): un puntito sobre la pieza, una línea fina
 * que se dibuja sola (diagonal + tramo recto) y una tarjetita con el título y para qué sirve.
 * No toma toques: tocar la foto sigue abriendo el zoom.
 *
 * Editor a mano (solo en tu compu, con `?editar` en la dirección): arrastrás el puntito y la etiqueta,
 * cambiás textos, y "Guardar" lo escribe en `data/detalles.json`.
 */
export function Detalles({ id, visible }: { id: string; visible: boolean }) {
  const [puntos, setPuntos] = useState<Detalle[]>(() => detallesDe(id));
  const [editar, setEditar] = useState(false);
  const [sel, setSel] = useState(0);
  const [estado, setEstado] = useState("");
  const [barraAbajo, setBarraAbajo] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const etiquetas = useRef<(HTMLSpanElement | null)[]>([]);
  // Corrimiento de cada etiqueta (px) para que nunca quede cortada por el borde de la foto.
  const [corrido, setCorrido] = useState<number[]>([]);
  const corridoActual = useRef<number[]>([]);
  const arrastre = useRef<{ i: number; que: "punto" | "etiqueta"; dx: number; dy: number } | null>(null);

  useEffect(() => {
    setEditar(process.env.NODE_ENV === "development" && new URLSearchParams(location.search).has("editar"));
  }, []);

  useLayoutEffect(() => {
    const medir = () => {
      const c = caja.current?.getBoundingClientRect();
      if (!c) return;
      const margen = 4;
      const nuevo = etiquetas.current.map((el, i) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        const izq = r.left - (corridoActual.current[i] ?? 0);
        const der = izq + r.width;
        if (izq < c.left + margen) return c.left + margen - izq;
        if (der > c.right - margen) return c.right - margen - der;
        return 0;
      });
      corridoActual.current = nuevo;
      setCorrido(nuevo);
    };
    medir();
    // Otra vez cuando termina la animación de entrada (el zoom de la ventana cambia las medidas).
    const t = window.setTimeout(medir, 450);
    window.addEventListener("resize", medir);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", medir);
    };
  }, [puntos]);

  if (!editar && puntos.length === 0) return null;
  const ver = visible || editar;

  const enPorcentaje = (e: React.PointerEvent) => {
    const r = caja.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const cambiar = (i: number, c: Partial<Detalle>) => {
    setPuntos((ps) => ps.map((p, j) => (j === i ? { ...p, ...c } : p)));
    setEstado("Sin guardar");
  };
  const agarrar = (i: number, que: "punto" | "etiqueta") => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const m = enPorcentaje(e);
    const p = puntos[i];
    arrastre.current = que === "punto" ? { i, que, dx: p.x - m.x, dy: p.y - m.y } : { i, que, dx: p.tx - m.x, dy: p.ty - m.y };
    setSel(i);
  };
  const mover = (e: React.PointerEvent) => {
    const a = arrastre.current;
    if (!a) return;
    const m = enPorcentaje(e);
    const lim = (v: number) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
    cambiar(a.i, a.que === "punto" ? { x: lim(m.x + a.dx), y: lim(m.y + a.dy) } : { tx: lim(m.x + a.dx), ty: lim(m.y + a.dy) });
  };
  const soltar = () => (arrastre.current = null);

  const guardar = async () => {
    setEstado("Guardando…");
    const r = await fetch("/api/detalles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, puntos }) });
    setEstado(r.ok ? "Guardado ✓" : "No se pudo guardar");
  };
  const textos = (i: number) => {
    const p = puntos[i];
    if (!p) return;
    const texto = prompt("Título (corto)", p.texto);
    if (texto === null) return;
    const sub = prompt("Para qué sirve (una línea, opcional)", p.sub ?? "");
    cambiar(i, { texto, sub: sub || undefined });
  };

  return (
    <div
      ref={caja}
      aria-hidden="true"
      className={`absolute inset-0 ${editar ? "touch-none" : "pointer-events-none"}`}
      // En el editor, que tocar no abra el zoom ni deslice las fotos.
      onClick={editar ? (e) => (e.preventDefault(), e.stopPropagation()) : undefined}
      onPointerMove={editar ? mover : undefined}
      onPointerUp={editar ? soltar : undefined}
    >
      {/* La foto es cuadrada: el dibujo escala parejo y la línea mantiene su grosor. */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {puntos.map((p, i) => {
          const s = lado(p);
          return (
            <polyline
              key={i}
              points={`${p.x},${p.y} ${p.tx - s * TRAMO},${p.ty} ${p.tx},${p.ty}`}
              pathLength={1}
              fill="none"
              stroke="rgb(var(--tinta))"
              strokeOpacity={0.85}
              strokeWidth={0.3}
              strokeLinejoin="round"
              strokeDasharray="1"
              style={{
                strokeDashoffset: ver ? 0 : 1,
                transition: editar ? "none" : `stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1) ${450 + i * 200}ms`,
              }}
            />
          );
        })}
      </svg>

      {puntos.map((p, i) => (
        <span key={i}>
          {/* Puntito: aro crema con centro oscuro y un latido suave. */}
          <span
            onPointerDown={editar ? agarrar(i, "punto") : undefined}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-opacity duration-500 ${editar ? "h-8 w-8 cursor-grab" : "h-3.5 w-3.5"}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: ver ? 1 : 0, transitionDelay: editar ? "0ms" : `${350 + i * 200}ms` }}
          >
            <span className="absolute h-3.5 w-3.5 animate-ping rounded-full bg-crema/60 [animation-duration:2.6s]" />
            <span className={`relative h-[9px] w-[9px] rounded-full bg-tinta ring-[2.5px] ring-crema ${editar && sel === i ? "outline outline-2 outline-marron" : ""}`} />
          </span>
          {/* Etiqueta: título + para qué sirve, al final del tramo recto. */}
          <span
            ref={(el) => {
              etiquetas.current[i] = el;
            }}
            onPointerDown={editar ? agarrar(i, "etiqueta") : undefined}
            onDoubleClick={editar ? () => textos(i) : undefined}
            className={`absolute w-max max-w-[8rem] rounded-[0.55rem] bg-crema/90 px-2 py-[5px] shadow-[0_6px_18px_-8px_rgb(var(--tinta)/0.55)] backdrop-blur-[3px] transition-[opacity,transform] duration-700 ease-suave ${
              lado(p) < 0 ? "text-right" : "text-left"
            } ${editar ? "cursor-grab" : ""} ${editar && sel === i ? "ring-1 ring-marron" : ""}`}
            style={{
              left: `${p.tx}%`,
              top: `${p.ty}%`,
              opacity: ver ? 1 : 0,
              transform: `translate(${lado(p) < 0 ? `calc(-100% - 3px + ${corrido[i] ?? 0}px)` : `${3 + (corrido[i] ?? 0)}px`}, ${ver ? "-50%" : "-30%"})`,
              transitionDelay: editar ? "0ms" : `${850 + i * 200}ms`,
            }}
          >
            <span className="block text-[9px] uppercase leading-tight tracking-[0.18em] text-tinta">{p.texto}</span>
            {p.sub && <span className="mt-0.5 block text-[10px] leading-tight text-tinta/65">{p.sub}</span>}
          </span>
        </span>
      ))}

      {editar && (
        <div className={`absolute inset-x-1.5 flex ${barraAbajo ? "bottom-1.5" : "top-1.5"} flex-wrap items-center gap-1 rounded-lg bg-tinta/85 p-1 text-[10px] text-crema`} onPointerDown={(e) => e.stopPropagation()}>
          <BotonEditor
            onClick={() => {
              setPuntos((ps) => [...ps, { x: 50, y: 50, tx: 58, ty: 35, texto: "Detalle", sub: "Para qué sirve" }]);
              setSel(puntos.length);
              setEstado("Sin guardar");
            }}
          >
            + Punto
          </BotonEditor>
          <BotonEditor onClick={() => setBarraAbajo((b) => !b)}>{barraAbajo ? "Barra ↑" : "Barra ↓"}</BotonEditor>
          <BotonEditor onClick={() => textos(sel)}>Texto</BotonEditor>
          <BotonEditor
            onClick={() => {
              setPuntos((ps) => ps.filter((_, j) => j !== sel));
              setSel(0);
              setEstado("Sin guardar");
            }}
          >
            Borrar
          </BotonEditor>
          <BotonEditor onClick={guardar} fuerte>
            Guardar
          </BotonEditor>
          {estado && <span className="px-1 text-crema/80">{estado}</span>}
        </div>
      )}
    </div>
  );
}

function BotonEditor({ onClick, fuerte, children }: { onClick: () => void; fuerte?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-md px-2 py-1.5 ${fuerte ? "bg-crema text-tinta" : "bg-crema/15"}`}
    >
      {children}
    </button>
  );
}
