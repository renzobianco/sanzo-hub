"use client";

import { useState } from "react";
import { ImagenProducto } from "./ImagenProducto";

export function KitGaleria({ imagenes, nombre }: { imagenes: string[]; nombre: string }) {
  const [activa, setActiva] = useState(0);
  return (
    <div className="space-y-3">
      <ImagenProducto
        src={imagenes[activa]}
        nombre={nombre}
        sizes="(min-width: 768px) 55vw, 100vw"
        tamTexto="text-lg md:text-2xl"
      />
      {imagenes.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {imagenes.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiva(i)}
              aria-label={`Ver foto ${i + 1} de ${imagenes.length}`}
              aria-current={i === activa}
              className={`transition-opacity ${i === activa ? "opacity-100 ring-1 ring-tinta" : "opacity-60 hover:opacity-100"}`}
            >
              <ImagenProducto src={src} nombre={`${nombre} ${i + 1}`} sizes="20vw" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
