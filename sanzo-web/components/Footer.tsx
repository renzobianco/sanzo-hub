import Link from "next/link";
import { legal, sitio } from "@/data/products";
import { IconoFacebook, IconoInstagram, IconoMail, IconoTiktok, IconoWhatsapp, IconoX } from "./Iconos";
import { Logo } from "./Logo";

/** Arma la lista de redes a partir de `sitio.redes` (las vacías no se muestran). */
function redes() {
  const { instagram, facebook, tiktok, x, whatsapp } = sitio.redes;
  const usuarioIg = instagram.replace(/^@/, "");
  // wa.me pide el número internacional: 54 + 9 (celular) + área y número, solo dígitos.
  const wa = whatsapp.replace(/\D/g, "");
  return [
    usuarioIg && { href: `https://www.instagram.com/${usuarioIg}`, texto: `@${usuarioIg}`, label: "Instagram de sanzo", Icono: IconoInstagram },
    facebook && { href: facebook, texto: "Facebook", label: "Facebook de sanzo", Icono: IconoFacebook },
    tiktok && { href: tiktok, texto: "TikTok", label: "TikTok de sanzo", Icono: IconoTiktok },
    x && { href: x, texto: "X", label: "X de sanzo", Icono: IconoX },
    wa && { href: `https://wa.me/549${wa}`, texto: whatsapp, label: "Escribinos por WhatsApp", Icono: IconoWhatsapp },
  ].filter((r) => !!r);
}

export function Footer({ hayLogo }: { hayLogo: boolean }) {
  const lista = redes();
  // Redes: solo el logo. WhatsApp: logo y número, para que se pueda leer y agendar.
  const iconos = lista.filter((r) => r.Icono !== IconoWhatsapp);
  const wa = lista.find((r) => r.Icono === IconoWhatsapp);
  return (
    <footer className="bg-crema">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-16 text-center md:flex-row md:justify-between md:px-8 md:text-left">
        <Logo hayLogo={hayLogo} />
        <ul className="flex items-center gap-3">
          {iconos.map(({ href, label, Icono }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-tinta/20 transition-[color,border-color,transform] duration-300 ease-suave hover:-translate-y-0.5 hover:border-marron hover:text-marron active:scale-95"
              >
                <Icono />
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center gap-1 md:items-end">
          {wa && (
            <a
              href={wa.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={wa.label}
              className="flex items-center gap-3 py-2 text-[15px] tracking-wide hover:text-marron"
            >
              <IconoWhatsapp />
              {wa.texto}
            </a>
          )}
          {sitio.email && (
            <a href={`mailto:${sitio.email}`} className="flex items-center gap-3 py-2 text-[15px] hover:text-marron">
              <IconoMail />
              {sitio.email}
            </a>
          )}
        </div>
      </div>
      {/* Legales obligatorios: botón de arrepentimiento y Defensa del Consumidor. */}
      <div className="border-t border-tinta/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-center text-[13px] md:flex-row md:justify-between md:px-8">
          <Link
            href="/arrepentimiento"
            className="rounded-full border border-tinta/70 px-4 py-2 text-[11px] uppercase tracking-marca transition-colors hover:bg-tinta hover:text-crema"
          >
            {legal.arrepentimiento.boton}
          </Link>
          <a
            href={legal.defensaConsumidor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-tinta/70 underline underline-offset-4 hover:text-marron"
          >
            {legal.defensaConsumidor.texto}
          </a>
        </div>
      </div>
    </footer>
  );
}
