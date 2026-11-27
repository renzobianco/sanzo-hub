"use client";

import { useEffect, useState } from "react";
import { ofertaChapita } from "@/data/products";
import { regaloKitVigente } from "@/lib/chapita";

/**
 * Black Friday: debajo del precio del kit, "+ [la chapita] Chapita grabada GRATIS" (Renzo, 2026-11-27: que se vea
 * antes de comprar, con la imagen). La chapita es el huesito "kala" real, recortado en círculo de la foto de las
 * chapitas grabadas (`regaloKit.aviso.foto`, 1080x1350, centro del huesito ≈ 702,500).
 * Se decide en el navegador (la página es estática): fuera de las fechas no aparece.
 */
export function AvisoRegaloKit({ className = "" }: { className?: string }) {
  const [ver, setVer] = useState(false);
  useEffect(() => setVer(regaloKitVigente()), []);
  if (!ver) return null;
  const a = ofertaChapita.regaloKit.aviso;
  const d = 68;
  const k = d / 400;
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-marron/40 px-3 py-2.5 ${className}`}>
      <span aria-hidden="true" className="text-[30px] font-light leading-none text-marron">+</span>
      <span
        aria-hidden="true"
        className="shrink-0 rounded-full border-2 border-crema shadow-md"
        style={{
          width: d,
          height: d,
          backgroundImage: `url(${a.foto})`,
          backgroundSize: `${1080 * k}px ${1350 * k}px`,
          backgroundPosition: `${-(702 * k - d / 2)}px ${-(500 * k - d / 2)}px`,
        }}
      />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-[15px] uppercase tracking-[0.12em] text-tinta">
          {a.titulo}
          <span className="rounded-md bg-marron px-2 py-0.5 text-[12px] font-medium tracking-[0.14em] text-crema">{a.etiqueta}</span>
        </p>
        <p className="mt-0.5 text-[12px] text-tinta/60">{a.bajada}</p>
      </div>
    </div>
  );
}
