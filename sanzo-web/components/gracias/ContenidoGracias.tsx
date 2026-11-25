"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ofertaChapita, sitio } from "@/data/products";
import { retiro } from "@/data/envios";
import { CLAVE_ULTIMO_PEDIDO } from "@/lib/pedido";
import { useCarrito } from "../carrito/CarritoProvider";
import { trackMeta } from "@/lib/meta/cliente";
import { datosDeContenidos, type MetaRespuestaPedido } from "@/lib/meta/datos";
import { IconoWhatsapp } from "../Iconos";

/** Pedidos cuya compra ya se avisó al Pixel en este navegador (para no mandarla dos veces si recarga). */
const CLAVE_COMPRAS_META = "sanzo-meta-compras";

/**
 * Purchase del Pixel al volver de Mercado Pago con el pago aprobado, con el mismo event_id que manda el
 * servidor desde el webhook (Meta cuenta una sola). Valor y productos: los que calculó el servidor al
 * hacer el pedido. Sin esos datos (otro navegador, sin almacenamiento) no se manda nada: alcanza con el del servidor.
 */
function compraAlPixel(numero: string, meta: MetaRespuestaPedido | undefined) {
  if (!meta || typeof meta.eventId !== "string" || !Array.isArray(meta.contents) || typeof meta.value !== "number") return;
  const enviadas: string[] = JSON.parse(window.localStorage.getItem(CLAVE_COMPRAS_META) ?? "[]");
  if (enviadas.includes(numero)) return;
  trackMeta("Purchase", { ...datosDeContenidos(meta.contents, meta.value, meta.personalizado), order_id: numero }, { eventId: meta.eventId, soloNavegador: true });
  window.localStorage.setItem(CLAVE_COMPRAS_META, JSON.stringify([...enviadas, numero].slice(-20)));
}

// `estado` lo pone /api/pedido (recibido) o Mercado Pago al volver (aprobado, pendiente, rechazado).
const TEXTOS: Record<string, { eyebrow: string; titulo: string; texto: string }> = {
  aprobado: {
    eyebrow: "Pago aprobado",
    titulo: "Ya casi sale a pasear",
    texto: "Recibimos tu pago. Lo preparamos con cuidado y te avisamos apenas lo despachemos.",
  },
  pendiente: {
    eyebrow: "Pago en proceso",
    titulo: "Ya lo tenemos",
    texto: "Tu pago se está procesando. Apenas se acredite, preparamos tu pedido y te avisamos.",
  },
  rechazado: {
    eyebrow: "El pago no se completó",
    titulo: "Probemos de nuevo",
    texto: "Tu pedido quedó guardado, pero el pago no pasó. Podés intentar otra vez o escribirnos y lo resolvemos.",
  },
  recibido: {
    eyebrow: "Pedido recibido",
    titulo: "Ya lo tenemos",
    texto: "Te escribimos en minutos para coordinar el envío y el pago.",
  },
};

export function ContenidoGracias() {
  const params = useSearchParams();
  const [numero, setNumero] = useState(params.get("pedido") ?? "");
  const [linkPago, setLinkPago] = useState("");
  const [fotoPerro, setFotoPerro] = useState(false);
  const [retiraEn, setRetiraEn] = useState("");
  const estado = params.get("estado") ?? "aprobado";
  const t = TEXTOS[estado] ?? TEXTOS.aprobado;
  const { listo, vaciar } = useCarrito();

  // El carrito se guarda hasta que el pago vuelve aprobado (o en proceso): recién ahí se vacía.
  useEffect(() => {
    if (listo && (estado === "aprobado" || estado === "pendiente")) vaciar();
  }, [listo, estado, vaciar]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CLAVE_ULTIMO_PEDIDO);
      if (!raw) return;
      const guardado = JSON.parse(raw);
      if (!numero) setNumero(guardado?.numero ?? "");
      if (typeof guardado?.pago === "string" && guardado.pago.startsWith("https://")) setLinkPago(guardado.pago);
      setFotoPerro(guardado?.fotoPerro === true);
      setRetiraEn(typeof guardado?.retiraEn === "string" ? guardado.retiraEn : "");
      // Solo con el pago aprobado de verdad por MP (vuelve con estado=aprobado y status=approved) y del mismo pedido.
      const pedidoUrl = params.get("pedido");
      if (params.get("estado") === "aprobado" && (params.get("status") ?? "approved") === "approved" && pedidoUrl && guardado?.numero === pedidoUrl)
        compraAlPixel(pedidoUrl, guardado.meta);
      // Pago aprobado o en proceso: ya no le ofrecemos "Terminar de pagar" en el checkout.
      if ((estado === "aprobado" || estado === "pendiente") && !guardado?.pagado)
        window.localStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify({ ...guardado, pagado: true }));
    } catch {
      // sin almacenamiento
    }
  }, [numero, estado]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center text-center">
      <p className="eyebrow">{t.eyebrow}</p>
      <h1 className="mt-4 text-3xl font-light uppercase leading-tight tracking-marca md:text-5xl">{t.titulo}</h1>
      {numero && (
        <p className="mt-8 border border-tinta/20 px-6 py-3 text-sm uppercase tracking-marca">
          Pedido <span className="text-marron">{numero}</span>
        </p>
      )}
      <p className="mt-8 text-lg font-light leading-relaxed text-tinta/85">{t.texto}</p>
      <p className="mt-3 text-[15px] text-tinta/75">Gracias por elegir sanzo para sus paseos.</p>
      {/* Retira en persona: coordinamos el día por WhatsApp, con el pedido y el lugar ya escritos. */}
      {retiraEn && estado !== "rechazado" && sitio.whatsapp.numero && (
        <div className="mt-10 w-full border border-tinta/20 px-5 py-6">
          <p className="eyebrow">Coordiná el retiro</p>
          <p className="mt-3 text-[15px] leading-relaxed text-tinta/85">Lo retirás en {retiraEn}.</p>
          <p className="mt-1 text-[14px] leading-relaxed text-tinta/70">{retiro.horarios}</p>
          <a
            href={`https://wa.me/${sitio.whatsapp.numero}?text=${encodeURIComponent(retiro.mensajeWhatsapp.replace("{numero}", numero || "").replace("{direccion}", retiraEn))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primario mt-5 inline-flex items-center gap-2"
          >
            <IconoWhatsapp width={18} height={18} />
            Coordinar por WhatsApp
          </a>
        </div>
      )}
      {/* Chapita con la foto de su perro: la pedimos acá, con el número de pedido ya escrito. */}
      {fotoPerro && estado !== "rechazado" && sitio.whatsapp.numero && (
        <div className="mt-10 w-full border border-tinta/20 px-5 py-6">
          <p className="eyebrow">Falta un paso</p>
          <p className="mt-3 text-[15px] leading-relaxed text-tinta/85">
            Mandanos la foto de tu perro para grabar en la chapita. Que se le vea bien la cara, de frente y con buena luz.
          </p>
          <a
            href={`https://wa.me/${sitio.whatsapp.numero}?text=${encodeURIComponent(ofertaChapita.foto.mensajeWhatsapp.replace("{numero}", numero || ""))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primario mt-5 inline-flex items-center gap-2"
          >
            <IconoWhatsapp width={18} height={18} />
            Mandar la foto
          </a>
        </div>
      )}
      {estado === "rechazado" && linkPago ? (
        <a href={linkPago} className="btn-primario mt-12">
          Intentar el pago de nuevo
        </a>
      ) : (
        <Link href="/" className="btn-borde mt-12">
          Volver a la tienda
        </Link>
      )}
    </div>
  );
}
