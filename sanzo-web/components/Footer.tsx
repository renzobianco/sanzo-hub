import { sitio } from "@/data/products";
import { IconoInstagram, IconoMail, IconoTiktok, IconoX } from "./Iconos";
import { Logo } from "./Logo";

export function Footer({ hayLogo }: { hayLogo: boolean }) {
  const { instagram, tiktok, x } = sitio.redes;
  return (
    <footer className="bg-crema">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-16 text-center md:flex-row md:justify-between md:px-8 md:text-left">
        <Logo hayLogo={hayLogo} />
        <ul className="flex items-center gap-6">
          {instagram && (
            <li>
              <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram de sanzo" className="hover:text-marron">
                <IconoInstagram />
              </a>
            </li>
          )}
          {tiktok && (
            <li>
              <a href={tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok de sanzo" className="hover:text-marron">
                <IconoTiktok />
              </a>
            </li>
          )}
          {x && (
            <li>
              <a href={x} target="_blank" rel="noopener noreferrer" aria-label="X de sanzo" className="hover:text-marron">
                <IconoX />
              </a>
            </li>
          )}
          {sitio.email && (
            <li>
              <a href={`mailto:${sitio.email}`} className="flex items-center gap-2 text-sm hover:text-marron">
                <IconoMail />
                {sitio.email}
              </a>
            </li>
          )}
        </ul>
        <p className="text-[11px] uppercase tracking-amplio text-tinta/70">{sitio.hechoEn}</p>
      </div>
    </footer>
  );
}
