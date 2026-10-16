import { sitio } from "@/data/products";
import { IconoFacebook, IconoInstagram, IconoMail, IconoTiktok, IconoWhatsapp } from "./Iconos";
import { Logo } from "./Logo";

/** Arma la lista de redes a partir de `sitio.redes` (las vacías no se muestran). */
function redes() {
  const { instagram, facebook, tiktok, whatsapp } = sitio.redes;
  const usuarioIg = instagram.replace(/^@/, "");
  // wa.me pide el número internacional: 54 + 9 (celular) + área y número, solo dígitos.
  const wa = whatsapp.replace(/\D/g, "");
  return [
    usuarioIg && { href: `https://www.instagram.com/${usuarioIg}`, texto: `@${usuarioIg}`, label: "Instagram de sanzo", Icono: IconoInstagram },
    facebook && { href: facebook, texto: "Facebook", label: "Facebook de sanzo", Icono: IconoFacebook },
    tiktok && { href: tiktok, texto: "TikTok", label: "TikTok de sanzo", Icono: IconoTiktok },
    wa && { href: `https://wa.me/549${wa}`, texto: whatsapp, label: "Escribinos por WhatsApp", Icono: IconoWhatsapp },
  ].filter((r) => !!r);
}

export function Footer({ hayLogo }: { hayLogo: boolean }) {
  return (
    <footer className="bg-crema">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-16 text-center md:flex-row md:justify-between md:px-8 md:text-left">
        <Logo hayLogo={hayLogo} />
        <ul className="flex flex-col items-center gap-1 md:flex-row md:gap-6">
          {redes().map(({ href, texto, label, Icono }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex items-center gap-3 py-2 text-[15px] tracking-wide hover:text-marron"
              >
                <Icono />
                {texto}
              </a>
            </li>
          ))}
          {sitio.email && (
            <li>
              <a href={`mailto:${sitio.email}`} className="flex items-center gap-3 py-2 text-[15px] hover:text-marron">
                <IconoMail />
                {sitio.email}
              </a>
            </li>
          )}
        </ul>
      </div>
    </footer>
  );
}
