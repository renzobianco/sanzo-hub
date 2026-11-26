"use client";

import { useEffect, useRef, useState } from "react";
import { formatearPrecio } from "@/lib/formato";
import type { ResultadoTarjeta } from "@/lib/mercadopago";

// Formulario de tarjeta de Mercado Pago (Card Payment Brick) dentro de la web: el cliente no sale a otra página.
// Los datos de la tarjeta los carga el formulario de MP (campos seguros) y nos llega solo un token de un uso.
// Docs: https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/card-payment-brick/introduction

interface Brick {
  unmount: () => void;
}
interface MercadoPagoSDK {
  bricks: () => { create: (tipo: string, id: string, opciones: unknown) => Promise<Brick> };
}
declare global {
  interface Window {
    MercadoPago?: new (clave: string, opciones?: { locale?: string }) => MercadoPagoSDK;
  }
}

const SDK = "https://sdk.mercadopago.com/js/v2";

function cargarSDK(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((ok, mal) => {
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SDK}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = SDK;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => ok());
    s.addEventListener("error", () => mal(new Error("sdk")));
  });
}

// Paleta de la marca (app/globals.css).
const TINTA = "#251D16";
const MARRON = "#946037";
const CREMA = "#F4EDE3";
const LINO = "#E8DCCB";
const TOPO = "#A39282";

export function PagoTarjeta({
  clavePublica,
  numero,
  total,
  email,
  linkMP,
  onResultado,
  onVolver,
}: {
  clavePublica: string;
  numero: string;
  total: number;
  email: string;
  /** Link de Checkout Pro del mismo pedido, por si prefiere pagar con Mercado Pago. */
  linkMP?: string;
  onResultado: (estado: "aprobado" | "pendiente") => void;
  onVolver: () => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const resultado = useRef(onResultado);
  resultado.current = onResultado;

  useEffect(() => {
    let brick: Brick | null = null;
    let cancelado = false;
    cargarSDK()
      .then(async () => {
        if (cancelado || !window.MercadoPago) return;
        const mp = new window.MercadoPago(clavePublica, { locale: "es-AR" });
        brick = await mp.bricks().create("cardPayment", "tarjeta-brick", {
          initialization: { amount: total, payer: { email } },
          customization: {
            paymentMethods: { maxInstallments: 12 },
            visual: {
              hideFormTitle: true,
              texts: { formSubmit: `Pagar ${formatearPrecio(total)}` },
              style: {
                theme: "default",
                customVariables: {
                  baseColor: TINTA,
                  baseColorFirstVariant: MARRON,
                  baseColorSecondVariant: MARRON,
                  textPrimaryColor: TINTA,
                  textSecondaryColor: TOPO,
                  formBackgroundColor: CREMA,
                  inputBackgroundColor: CREMA,
                  outlinePrimaryColor: TINTA,
                  outlineSecondaryColor: LINO,
                  buttonTextColor: CREMA,
                  errorColor: MARRON,
                  borderRadiusSmall: "6px",
                  borderRadiusMedium: "8px",
                  borderRadiusLarge: "8px",
                  borderRadiusFull: "999px",
                  formPadding: "0px",
                  fontWeightNormal: "300",
                  fontWeightSemiBold: "400",
                },
              },
            },
          },
          callbacks: {
            onReady: () => setCargando(false),
            onError: (e: unknown) => console.error("[tarjeta]", e),
            onSubmit: async (tarjeta: unknown) => {
              setError("");
              try {
                const res = await fetch("/api/pago-tarjeta", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ numero, tarjeta }),
                });
                const data = (await res.json()) as ({ ok: true } & ResultadoTarjeta) | { ok: false; error: string };
                if (!data.ok) return setError(data.error);
                if (data.estado === "rechazado") return setError(data.mensaje ?? "El pago no pasó. Probá con otra tarjeta.");
                resultado.current(data.estado);
              } catch {
                setError("No pudimos conectar. Probá de nuevo en un ratito.");
              }
            },
          },
        });
        if (cancelado) brick.unmount();
      })
      .catch(() => {
        setCargando(false);
        setError("No pudimos cargar el formulario de tarjeta. Probá con Mercado Pago.");
      });
    return () => {
      cancelado = true;
      brick?.unmount();
    };
  }, [clavePublica, numero, total, email]);

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-baseline justify-between border-b border-tinta/15 pb-4">
        <p className="text-sm uppercase tracking-marca">
          Pedido <span className="text-marron">{numero}</span>
        </p>
        <p className="text-lg">{formatearPrecio(total)}</p>
      </div>
      <h2 className="titulo-form mt-8">Pagá con tu tarjeta</h2>
      <p className="-mt-2 mb-6 text-[15px] leading-snug text-tinta/75">Crédito o débito. Lo cargás acá, sin salir de la web.</p>

      {cargando && <div className="h-[420px] animate-pulse rounded-lg bg-lino/60" aria-busy="true" />}
      <div id="tarjeta-brick" />

      <p role="alert" className="mt-4 text-[15px] text-marron empty:hidden">
        {error}
      </p>

      <div className="mt-8 space-y-3 border-t border-tinta/15 pt-6">
        {linkMP && (
          <a href={linkMP} className="btn-borde w-full py-4">
            Pagar con Mercado Pago
          </a>
        )}
        <button type="button" onClick={onVolver} className="w-full py-2 text-[15px] text-tinta/70 underline underline-offset-4">
          Volver a mis datos
        </button>
      </div>
    </div>
  );
}
