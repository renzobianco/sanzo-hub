"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CLAVE_ULTIMO_PEDIDO } from "@/lib/pedido";

export function ContenidoGracias() {
  const params = useSearchParams();
  const [numero, setNumero] = useState(params.get("pedido") ?? "");
  // "recibido" = falta pagar (le escribimos con el link). Sin estado = vuelve de Mercado Pago.
  const pendiente = params.get("estado") === "recibido";

  useEffect(() => {
    if (numero) return;
    try {
      const raw = window.localStorage.getItem(CLAVE_ULTIMO_PEDIDO);
      if (raw) setNumero(JSON.parse(raw)?.numero ?? "");
    } catch {
      // sin almacenamiento
    }
  }, [numero]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center text-center">
      <p className="eyebrow">{pendiente ? "Pedido recibido" : "Gracias"}</p>
      <h1 className="mt-4 text-3xl font-light uppercase leading-tight tracking-marca md:text-5xl">
        {pendiente ? "Ya lo tenemos" : "Ya casi sale a pasear"}
      </h1>
      {numero && (
        <p className="mt-8 border border-tinta/20 px-6 py-3 text-sm uppercase tracking-marca">
          Pedido <span className="text-marron">{numero}</span>
        </p>
      )}
      <p className="mt-8 text-lg font-light leading-relaxed text-tinta/85">
        {pendiente
          ? "Te escribimos en minutos con el link de pago."
          : "Recibimos tu pedido. Lo preparamos con cuidado y te avisamos apenas lo despachemos."}
      </p>
      <p className="mt-3 text-[15px] text-tinta/75">Gracias por elegir sanzo para sus paseos.</p>
      <Link href="/" className="btn-borde mt-12">
        Volver a la tienda
      </Link>
    </div>
  );
}
