"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  calcularTotales,
  claveLinea,
  MAX_CANTIDAD,
  type LineaCarrito,
  type Totales,
  type Ubicacion,
} from "@/lib/carrito";

const CLAVE_STORAGE = "sanzo-carrito-v1";

interface CarritoContexto {
  lineas: LineaCarrito[];
  ubicacion: Ubicacion;
  totales: Totales;
  abierto: boolean;
  /** true cuando ya se leyó localStorage (evita parpadeos en /checkout). */
  listo: boolean;
  agregar: (productoId: string, opcion?: string, opts?: { abrir?: boolean }) => void;
  cambiarCantidad: (key: string, cantidad: number) => void;
  quitar: (key: string) => void;
  vaciar: () => void;
  setUbicacion: (u: Ubicacion) => void;
  abrir: () => void;
  cerrar: () => void;
}

const Ctx = createContext<CarritoContexto | null>(null);

const ubicacionVacia: Ubicacion = { provincia: "", enGBA: null };

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const [ubicacion, setUbicacion] = useState<Ubicacion>(ubicacionVacia);
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState(false);

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

  useEffect(() => {
    if (!listo) return;
    try {
      window.localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ lineas, ubicacion }));
    } catch {
      // Sin almacenamiento disponible: el carrito vive solo en memoria.
    }
  }, [lineas, ubicacion, listo]);

  const agregar = useCallback<CarritoContexto["agregar"]>((productoId, opcion, opts) => {
    const key = claveLinea(productoId, opcion);
    setLineas((prev) => {
      const existe = prev.find((l) => l.key === key);
      if (existe) {
        return prev.map((l) => (l.key === key ? { ...l, cantidad: Math.min(MAX_CANTIDAD, l.cantidad + 1) } : l));
      }
      return [...prev, { key, productoId, opcion, cantidad: 1 }];
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

  const quitar = useCallback((key: string) => setLineas((prev) => prev.filter((l) => l.key !== key)), []);
  const vaciar = useCallback(() => setLineas([]), []);
  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);

  const totales = useMemo(() => calcularTotales(lineas, ubicacion), [lineas, ubicacion]);

  const valor = useMemo(
    () => ({
      lineas,
      ubicacion,
      totales,
      abierto,
      listo,
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
      setUbicacion,
      abrir,
      cerrar,
    }),
    [lineas, ubicacion, totales, abierto, listo, agregar, cambiarCantidad, quitar, vaciar, abrir, cerrar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCarrito() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCarrito tiene que usarse dentro de <CarritoProvider>");
  return ctx;
}
