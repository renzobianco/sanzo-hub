"use client";

import { useRef } from "react";
import { guiaTalles } from "@/data/products";
import { IconoCerrar } from "./Iconos";

export function GuiaTalles() {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="text-xs uppercase tracking-marca text-tinta/80 underline underline-offset-4 hover:text-marron"
      >
        Guía de talles
      </button>
      <dialog
        ref={ref}
        aria-labelledby="guia-titulo"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="w-[calc(100%-2rem)] max-w-lg bg-crema p-0 text-tinta backdrop:bg-tinta/50"
      >
        <div className="p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between">
            <h2 id="guia-titulo" className="text-lg uppercase tracking-marca">
              Guía de talles
            </h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar guía de talles" className="-m-2 p-2">
              <IconoCerrar />
            </button>
          </div>
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-tinta/20">
                <th scope="col" className="eyebrow py-3 font-normal">
                  Talle
                </th>
                <th scope="col" className="eyebrow py-3 font-normal">
                  Contorno de pecho
                </th>
                <th scope="col" className="eyebrow py-3 font-normal">
                  Cuello
                </th>
              </tr>
            </thead>
            <tbody>
              {guiaTalles.filas.map((f) => (
                <tr key={f.talle} className="border-b border-tinta/10">
                  <th scope="row" className="py-3 font-normal">
                    {f.talle}
                  </th>
                  <td className="py-3">{f.pecho || "—"}</td>
                  <td className="py-3">{f.cuello || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-5 text-sm text-tinta/75">{guiaTalles.nota}</p>
        </div>
      </dialog>
    </>
  );
}
