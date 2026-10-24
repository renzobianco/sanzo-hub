"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { chapita, getProducto, ofertaChapita } from "@/data/products";
import { llevaChapita } from "@/lib/chapita";
import {
  armarCombos,
  calcularTotales,
  claveLinea,
  MAX_CANTIDAD,
  type LineaCarrito,
  type Totales,
  type Ubicacion,
} from "@/lib/carrito";
import type { Personalizacion } from "@/lib/personalizacion";
import { OfertaChapita } from "./OfertaChapita";

const CLAVE_STORAGE = "sanzo-carrito-v1";

interface CarritoContexto {
  lineas: LineaCarrito[];
  ubicacion: Ubicacion;
  totales: Totales;
  abierto: boolean;
  /** true cuando ya se leyó localStorage (evita parpadeos en /checkout). */
  listo: boolean;
  /** Id del combo que se acaba de armar con piezas sueltas (unos segundos), para avisarlo. */
  armado: string | null;
  agregar: (
    productoId: string,
    opcion?: string,
    opts?: { abrir?: boolean; personalizacion?: Personalizacion },
  ) => void;
  cambiarCantidad: (key: string, cantidad: number) => void;
  /** Pone, cambia o saca (undefined) la personalización de una línea. */
  personalizar: (key: string, personalizacion?: Personalizacion) => void;
  quitar: (key: string) => void;
  vaciar: () => void;
  setUbicacion: (u: Ubicacion) => void;
  abrir: () => void;
  cerrar: () => void;
  /**
   * Muestra el cartel de la chapita (si corresponde) y después llama a `seguir`
   * (abrir el carrito o ir al checkout). Si ya tiene chapita o dijo que no, sigue directo.
   */
  ofrecerChapita: (seguir: () => void) => void;
  /**
   * Combo que trae chapita (Combo Identidad): abre directo la personalización y, si la completa,
   * llama a `listo` con el texto del grabado ("Corazón · Coco"). Si cancela, no pasa nada.
   */
  pedirGrabado: (listo: (grabado: string) => void) => void;
}

const Ctx = createContext<CarritoContexto | null>(null);

const ubicacionVacia: Ubicacion = { provincia: "", enGBA: null };

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const [ubicacion, setUbicacion] = useState<Ubicacion>(ubicacionVacia);
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState(false);
  const [armado, setArmado] = useState<string | null>(null);
  const [seguirTrasOferta, setSeguirTrasOferta] = useState<(() => void) | null>(null);
  const [alGrabar, setAlGrabar] = useState<((grabado: string) => void) | null>(null);
  const dijoQueNo = useRef(false);
  const lineasRef = useRef(lineas);
  lineasRef.current = lineas;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CLAVE_STORAGE);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data?.lineas)) setLineas(data.lineas);
        if (data?.ubicacion && typeof data.ubicacion.provincia === "string") setUbicacion(data.ubicacion);
      }
    } catch {
      // localStorage bloqueado o datos viejos: arrancamos vacío.
    }
    setListo(true);
  }, []);

  // Si las piezas sueltas completan un combo, quedan reemplazadas por el combo (y se avisa unos segundos).
  useEffect(() => {
    const { lineas: nuevas, armados } = armarCombos(lineas);
    if (armados.length === 0) return;
    setLineas(nuevas);
    setArmado(armados[armados.length - 1]);
  }, [lineas]);

  useEffect(() => {
    if (!armado) return;
    const t = window.setTimeout(() => setArmado(null), 5000);
    return () => window.clearTimeout(t);
  }, [armado]);

  useEffect(() => {
    if (!listo) return;
    try {
      window.localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ lineas, ubicacion }));
    } catch {
      // Sin almacenamiento disponible: el carrito vive solo en memoria.
    }
  }, [lineas, ubicacion, listo]);

  const agregar = useCallback<CarritoContexto["agregar"]>((productoId, opcion, opts) => {
    const personalizacion = opts?.personalizacion;
    const key = claveLinea(productoId, opcion, personalizacion);
    setLineas((prev) => {
      const existe = prev.find((l) => l.key === key);
      if (existe) {
        return prev.map((l) => (l.key === key ? { ...l, cantidad: Math.min(MAX_CANTIDAD, l.cantidad + 1) } : l));
      }
      return [...prev, { key, productoId, opcion, personalizacion, cantidad: 1 }];
    });
    if (opts?.abrir !== false) setAbierto(true);
  }, []);

  const cambiarCantidad = useCallback((key: string, cantidad: number) => {
    setLineas((prev) =>
      cantidad <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, cantidad: Math.min(MAX_CANTIDAD, cantidad) } : l)),
    );
  }, []);

  // Cambia la clave de la línea; si ya había otra igual (mismo producto, opción y personalización), se juntan.
  const personalizar = useCallback((key: string, personalizacion?: Personalizacion) => {
    setLineas((prev) => {
      const linea = prev.find((l) => l.key === key);
      if (!linea) return prev;
      const nueva = claveLinea(linea.productoId, linea.opcion, personalizacion);
      if (nueva === key) return prev.map((l) => (l.key === key ? { ...l, personalizacion } : l));
      const igual = prev.find((l) => l.key === nueva);
      if (igual) {
        return prev
          .filter((l) => l.key !== key)
          .map((l) => (l.key === nueva ? { ...l, cantidad: Math.min(MAX_CANTIDAD, l.cantidad + linea.cantidad) } : l));
      }
      return prev.map((l) => (l.key === key ? { ...l, key: nueva, personalizacion } : l));
    });
  }, []);

  const quitar = useCallback((key: string) => setLineas((prev) => prev.filter((l) => l.key !== key)), []);
  const vaciar = useCallback(() => setLineas([]), []);
  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);

  const ofrecerChapita = useCallback((seguir: () => void) => {
    const yaTiene = lineasRef.current.some((l) => {
      const p = getProducto(l.productoId);
      return !!p && llevaChapita(p);
    });
    if (!ofertaChapita.activa || !chapita.disponible || dijoQueNo.current || yaTiene) seguir();
    else setSeguirTrasOferta(() => seguir);
  }, []);

  const pedirGrabado = useCallback((listo: (grabado: string) => void) => setAlGrabar(() => listo), []);

  function cerrarOferta(sumar?: string) {
    const seguir = seguirTrasOferta;
    if (sumar) agregar(chapita.id, sumar, { abrir: false });
    else dijoQueNo.current = true; // no se la volvemos a ofrecer en esta visita
    setSeguirTrasOferta(null);
    seguir?.();
  }

  const totales = useMemo(() => calcularTotales(lineas, ubicacion), [lineas, ubicacion]);

  const valor = useMemo(
    () => ({
      lineas,
      ubicacion,
      totales,
      abierto,
      listo,
      armado,
      agregar,
      cambiarCantidad,
      personalizar,
      quitar,
      vaciar,
      setUbicacion,
      abrir,
      cerrar,
      ofrecerChapita,
      pedirGrabado,
    }),
    [lineas, ubicacion, totales, abierto, listo, armado, agregar, cambiarCantidad, personalizar, quitar, vaciar, abrir, cerrar, ofrecerChapita, pedirGrabado],
  );

  return (
    <Ctx.Provider value={valor}>
      {children}
      {/* Un solo cartel: la oferta al comprar, o la personalización de la chapita de un combo. */}
      <OfertaChapita
        abierta={seguirTrasOferta !== null || alGrabar !== null}
        modo={alGrabar ? "combo" : "oferta"}
        onSumar={(texto) => {
          if (alGrabar) {
            alGrabar(texto);
            setAlGrabar(null);
          } else cerrarOferta(texto);
        }}
        onNo={() => (alGrabar ? setAlGrabar(null) : cerrarOferta())}
      />
    </Ctx.Provider>
  );
}

export function useCarrito() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCarrito tiene que usarse dentro de <CarritoProvider>");
  return ctx;
}
