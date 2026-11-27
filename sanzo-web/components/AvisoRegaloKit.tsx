"use client";

import { useEffect, useState } from "react";
import { ofertaChapita } from "@/data/products";
import { regaloKitVigente } from "@/lib/chapita";

/**
 * Black Friday: aviso de la chapita de regalo debajo del precio del kit.
 * Se decide en el navegador (la página es estática): fuera de las fechas no aparece.
 */
export function AvisoRegaloKit({ className = "" }: { className?: string }) {
  const [ver, setVer] = useState(false);
  useEffect(() => setVer(regaloKitVigente()), []);
  if (!ver) return null;
  return (
    <p className={`rounded-lg border border-marron/40 px-3 py-2 text-[13px] leading-snug text-marron ${className}`}>
      {ofertaChapita.regaloKit.aviso}
    </p>
  );
}
