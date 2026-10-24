/**
 * Lo que trae adentro una pieza (ej. "+ rollito"), dibujado como un rollito de bolsitas:
 * la punta enrollada en espiral (gira lento) y el texto sobre la tira que se desenrolla.
 */
export function Rollito({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <span
      className={`pointer-events-none inline-flex animate-pop items-center gap-1 whitespace-nowrap rounded-r-full rounded-l-[999px] bg-tinta py-[3px] pl-[3px] pr-2 text-[9px] lowercase tracking-[0.06em] text-crema shadow-[0_3px_8px_-3px_rgb(var(--tinta)/0.6)] [animation-delay:600ms] ${className}`}
    >
      <span aria-hidden="true" className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-marron ring-1 ring-crema/30">
        <svg viewBox="0 0 16 16" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" className="animate-girar-lento">
          <path d="M8 8a.75.75 0 0 1 1.5 0a1.5 1.5 0 0 1-3 0a2.25 2.25 0 0 1 4.5 0a3 3 0 0 1-6 0a3.75 3.75 0 0 1 7.5 0" />
        </svg>
      </span>
      {texto}
    </span>
  );
}
