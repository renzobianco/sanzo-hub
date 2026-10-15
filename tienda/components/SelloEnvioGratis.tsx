/** Sello circular girado "ENVÍO GRATIS", marrón sobre crema. */
export function SelloEnvioGratis({ id, className = "", tam = 132 }: { id: string; className?: string; tam?: number }) {
  const texto = "ENVÍO GRATIS · EN TODO EL PAÍS · ";
  return (
    <div
      role="img"
      aria-label="Envío gratis"
      className={`relative shrink-0 -rotate-12 rounded-full bg-crema text-marron shadow-[0_8px_30px_rgb(var(--tinta)/0.12)] ${className}`}
      style={{ width: tam, height: tam }}
    >
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full animate-giro" aria-hidden="true">
        <defs>
          <path id={`sello-${id}`} d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text fill="currentColor" fontSize="9.2" letterSpacing="2.6" fontWeight="400">
          <textPath href={`#sello-${id}`}>{texto}</textPath>
        </text>
      </svg>
      <div className="absolute inset-[14%] flex flex-col items-center justify-center rounded-full border border-marron/70 text-center leading-none">
        <span className="text-[0.62em] font-normal tracking-[0.2em]" style={{ fontSize: tam * 0.13 }}>
          ENVÍO
        </span>
        <span className="mt-1 font-normal tracking-[0.12em]" style={{ fontSize: tam * 0.155 }}>
          GRATIS
        </span>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-marron" />
    </div>
  );
}
