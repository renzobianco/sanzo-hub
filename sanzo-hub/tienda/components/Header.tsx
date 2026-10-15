"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { IconoBolsa, IconoCerrar, IconoMenu } from "./Iconos";
import { useCarrito } from "./carrito/CarritoProvider";

const LINKS = [
  { href: "/#kit", label: "Kit" },
  { href: "/#combos", label: "Combos" },
  { href: "/#productos", label: "Productos" },
  { href: "/#envios", label: "Envíos" },
  { href: "/#preguntas", label: "Preguntas" },
];

export function Header({ hayLogo }: { hayLogo: boolean }) {
  const { totales, abrir, listo } = useCarrito();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const cantidad = listo ? totales.unidades : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-tinta/10 bg-crema/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <button
          type="button"
          className="-ml-2 p-2 md:hidden"
          aria-label={menu ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menu}
          aria-controls="menu-mobile"
          onClick={() => setMenu((m) => !m)}
        >
          {menu ? <IconoCerrar /> : <IconoMenu />}
        </button>

        <Link href="/" aria-label="sanzo, inicio" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          <Logo hayLogo={hayLogo} />
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-9">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-[12px] uppercase tracking-marca text-tinta/80 transition-colors hover:text-marron"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={abrir}
          className="relative -mr-2 p-2 transition-colors hover:text-marron"
          aria-label={`Abrir carrito, ${cantidad} ${cantidad === 1 ? "producto" : "productos"}`}
        >
          <IconoBolsa />
          {cantidad > 0 && (
            <span className="absolute right-0 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-marron px-1 text-[10px] font-normal text-crema">
              {cantidad}
            </span>
          )}
        </button>
      </div>

      <nav
        id="menu-mobile"
        aria-label="Principal mobile"
        className={`overflow-hidden border-tinta/10 bg-crema transition-[max-height] duration-500 md:hidden ${
          menu ? "max-h-96 border-t" : "max-h-0"
        }`}
        inert={!menu}
      >
        <ul className="flex flex-col px-4 py-4">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setMenu(false)}
                className="block py-3 text-sm uppercase tracking-marca text-tinta/85"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
