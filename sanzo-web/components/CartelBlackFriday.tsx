"use client";

import { useEffect, useState } from "react";
import { ofertaChapita } from "@/data/products";
import { regaloKitVigente } from "@/lib/chapita";

/**
 * Black Friday: cartel corredizo arriba de todo, en toda la web (Renzo, 2026-11-27).
 * Solo entre las fechas de `ofertaChapita.regaloKit` (se decide en el navegador: la página es estática).
 * Lleva al kit. El contenido se repite para que el loop no tenga corte (como la Cinta del hero).
 */
export function CartelBlackFriday() {
  const [ver, setVer] = useState(false);
  useEffect(() => setVer(regaloKitVigente()), []);
  if (!ver) return null;
  const textos = ofertaChapita.regaloKit.cartel;
  return (
    <a href="/#kit" className="block overflow-hidden bg-tinta py-2.5 text-crema" aria-label={textos.join(" · ")}>
      <ul className="flex w-max animate-cinta" aria-hidden="true">
        {[0, 1, 2, 3].map((copia) =>
          textos.map((t, i) => (
            <li key={`${copia}-${i}`} className="flex items-center whitespace-nowrap text-[12px] uppercase tracking-amplio">
              <span className={`px-5 ${i === 0 ? "font-medium" : ""}`}>{t}</span>
              <span className="text-marron">✦</span>
            </li>
          )),
        )}
      </ul>
    </a>
  );
}
