/**
 * Lo que trae adentro una pieza (ej. "+ rollito"): píldora oscura con una foto chiquita de lo que trae
 * (el rollito de bolsitas) y el texto. Sin foto, solo el texto.
 */
export function Rollito({ texto, foto, className = "" }: { texto: string; foto?: string; className?: string }) {
  return (
    <span
      className={`pointer-events-none inline-flex animate-pop items-center gap-1 whitespace-nowrap rounded-full bg-tinta py-[3px] ${foto ? "pl-[3px]" : "pl-2"} pr-2 text-[9px] lowercase tracking-[0.06em] text-crema shadow-[0_3px_8px_-3px_rgb(var(--tinta)/0.6)] [animation-delay:600ms] ${className}`}
    >
      {foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" aria-hidden="true" width={16} height={16} className="h-4 w-4 shrink-0 rounded-full bg-crema object-cover" />
      )}
      {texto}
    </span>
  );
}
