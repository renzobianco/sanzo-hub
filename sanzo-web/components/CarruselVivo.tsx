"use client";

import { useEffect, useRef } from "react";

/**
 * Carrusel deslizable donde la tarjeta del centro queda a tamaño completo y las de los costados
 * se achican y apagan apenas (como el selector de fotos del iPhone).
 */
export function CarruselVivo({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const ul = ref.current;
    if (!ul || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const actualizar = () => {
      frame = 0;
      const centro = ul.scrollLeft + ul.clientWidth / 2;
      for (const li of Array.from(ul.children) as HTMLElement[]) {
        const d = Math.min(1, Math.abs(li.offsetLeft + li.offsetWidth / 2 - centro) / ul.clientWidth);
        li.style.transform = `scale(${1 - d * 0.08})`;
        li.style.opacity = String(1 - d * 0.45);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(actualizar);
    };
    ul.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    actualizar();
    return () => {
      ul.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
}
