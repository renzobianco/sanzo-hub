"use client";

/**
 * Flechitas a los costados de una galería que se desliza, para que se note que hay más fotos.
 * La de la izquierda aparece cuando ya pasaste la primera; la de la derecha se esconde en la última
 * y, mientras estás en la primera, se mueve apenas hacia el costado (se apaga con "reducir movimiento").
 */
export function FlechasGaleria({ activa, total, ir }: { activa: number; total: number; ir: (i: number) => void }) {
  if (total <= 1) return null;
  const boton =
    "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-crema/80 text-tinta shadow-[0_4px_14px_-6px_rgb(var(--tinta)/0.5)] backdrop-blur-sm transition-opacity duration-500 active:scale-90";
  return (
    <>
      <button
        type="button"
        onClick={() => ir(activa - 1)}
        aria-label="Foto anterior"
        tabIndex={activa > 0 ? 0 : -1}
        className={`${boton} left-2.5 ${activa > 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <Flecha className="rotate-180" />
      </button>
      <button
        type="button"
        onClick={() => ir(activa + 1)}
        aria-label="Foto siguiente"
        tabIndex={activa < total - 1 ? 0 : -1}
        className={`${boton} right-2.5 ${activa < total - 1 ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <Flecha className={activa === 0 ? "motion-safe:animate-empujar" : ""} />
      </button>
    </>
  );
}

function Flecha({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
