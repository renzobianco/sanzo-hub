"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LineaNeon } from "./LineaNeon";
import { Logo } from "./Logo";
import { IconoBolsa, IconoCerrar, IconoMenu } from "./Iconos";
import { useCarrito } from "./carrito/CarritoProvider";

const LINKS = [
  { href: "/#kit", label: "Kit" },
  { href: "/#combos", label: "Combos" },
  { href: "/#productos", label: "Individuales" },
  { href: "/#preguntas", label: "Preguntas" },
];

export function Header({ hayLogo }: { hayLogo: boolean }) {
  const { totales, abrir, listo } = useCarrito();
  const [menu, setMenu] = useState(false);
  // Se esconde al bajar y vuelve al subir (como en las apps); con sombra apenas te movés.
  const [oculto, setOculto] = useState(false);
  const [movido, setMovido] = useState(false);
  useEffect(() => {
    let ultimo = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setMovido(y > 8);
      if (Math.abs(y - ultimo) > 6) setOculto(y > ultimo && y > 320);
      ultimo = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // La bolsa salta cuando se agrega algo.
  const [salto, setSalto] = useState(false);
  const previo = useRef(0);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const cantidad = listo ? totales.unidades : 0;

  useEffect(() => {
    if (cantidad > previo.current && previo.current >= 0 && listo) {
      setSalto(true);
      const t = setTimeout(() => setSalto(false), 700);
      previo.current = cantidad;
      return () => clearTimeout(t);
    }
    previo.current = cantidad;
  }, [cantidad, listo]);

  return (
    <header
      className={`sticky top-0 z-40 bg-crema/85 backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-500 ease-suave ${
        oculto && !menu ? "-translate-y-full" : "translate-y-0"
      } ${movido ? "shadow-[0_8px_30px_-12px_rgb(var(--tinta)/0.18)]" : ""}`}
    >
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

        <Link href="/#por-que" aria-label="sanzo: por qué sanzo" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          <Logo hayLogo={hayLogo} />
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-9">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="group relative text-[12px] uppercase tracking-marca text-tinta/80 transition-colors hover:text-marron"
                >
                  {l.label}
                  <span aria-hidden="true" className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-marron transition-transform duration-500 ease-suave group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={abrir}
          className={`relative -mr-2 p-2 transition-colors hover:text-marron ${salto ? "animate-salto" : ""}`}
          aria-label={`Abrir carrito, ${cantidad} ${cantidad === 1 ? "producto" : "productos"}`}
        >
          <IconoBolsa />
          {cantidad > 0 && (
            <span key={cantidad} className="absolute right-0 top-0.5 flex h-[18px] min-w-[18px] animate-pop items-center justify-center rounded-full bg-marron px-1 text-[10px] font-normal text-crema">
              {cantidad}
            </span>
          )}
        </button>
      </div>
      <LineaNeon />

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
