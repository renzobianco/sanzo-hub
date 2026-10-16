"use client";

import { useState } from "react";
import { legal } from "@/data/products";

type Estado = { tipo: "inicio" } | { tipo: "enviando" } | { tipo: "listo"; codigo: string } | { tipo: "error"; mensaje: string };

/** Formulario del botón de arrepentimiento. Al enviarlo muestra el código de trámite. */
export function FormularioArrepentimiento() {
  const [estado, setEstado] = useState<Estado>({ tipo: "inicio" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.currentTarget));
    setEstado({ tipo: "enviando" });
    try {
      const res = await fetch("/api/arrepentimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const r = (await res.json()) as { ok: boolean; codigo?: string; error?: string };
      if (r.ok && r.codigo) setEstado({ tipo: "listo", codigo: r.codigo });
      else setEstado({ tipo: "error", mensaje: r.error ?? "No pudimos enviarlo. Probá de nuevo." });
    } catch {
      setEstado({ tipo: "error", mensaje: "No pudimos enviarlo. Revisá tu conexión y probá de nuevo." });
    }
  }

  if (estado.tipo === "listo") {
    return (
      <div role="status" className="mt-10 animate-entrada bg-lino p-6 md:p-8">
        <p className="text-[16px]">{legal.arrepentimiento.listo}</p>
        <p className="mt-4 text-3xl font-light tracking-marca text-marron">{estado.codigo}</p>
      </div>
    );
  }

  const campo = "campo mt-1";
  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-6">
      <label className="block">
        <span className="eyebrow">Nombre y apellido</span>
        <input name="nombre" required autoComplete="name" className={campo} />
      </label>
      <label className="block">
        <span className="eyebrow">Mail</span>
        <input name="email" type="email" required autoComplete="email" className={campo} />
      </label>
      <label className="block">
        <span className="eyebrow">Celular (opcional)</span>
        <input name="celular" type="tel" autoComplete="tel" className={campo} />
      </label>
      <label className="block">
        <span className="eyebrow">Número de pedido</span>
        <input name="pedido" required placeholder="Ej. SZ-MG8K2Q" className={`${campo} uppercase`} />
      </label>
      <label className="block">
        <span className="eyebrow">Motivo (opcional)</span>
        <textarea name="motivo" rows={3} className={`${campo} resize-none`} />
      </label>
      {/* Honeypot anti-spam: invisible para personas. */}
      <input name="empresa" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button type="submit" disabled={estado.tipo === "enviando"} className="btn-primario w-full py-4">
        {estado.tipo === "enviando" ? "Enviando…" : "Enviar pedido de arrepentimiento"}
      </button>
      {estado.tipo === "error" && (
        <p role="alert" className="text-sm text-marron">
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}
