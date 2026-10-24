"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ofertaChapita, sitio } from "@/data/products";
import { CLAVE_ULTIMO_PEDIDO } from "@/lib/pedido";
import { IconoWhatsapp } from "../Iconos";

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
  const estado = params.get("estado") ?? "aprobado";
  const t = TEXTOS[estado] ?? TEXTOS.aprobado;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CLAVE_ULTIMO_PEDIDO);
      if (!raw) return;
      const guardado = JSON.parse(raw);
      if (!numero) setNumero(guardado?.numero ?? "");
      if (typeof guardado?.pago === "string" && guardado.pago.startsWith("https://")) setLinkPago(guardado.pago);
      setFotoPerro(guardado?.fotoPerro === true);
    } catch {
      // sin almacenamiento
    }
  }, [numero]);

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
