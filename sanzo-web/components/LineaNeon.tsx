/**
 * Línea marrón con brillo tipo neón y una luz que la recorre. Separa partes de la página.
 * `discreta`: más fina y con menos brillo (la del header).
 */
export function LineaNeon({ discreta = false }: { discreta?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`relative z-10 ${
        discreta
          ? "h-px bg-marron/70 shadow-[0_0_6px_0_rgb(var(--marron)/0.35)]"
          : "h-[3px] bg-marron shadow-[0_0_8px_1px_rgb(var(--marron)/0.9),0_0_22px_4px_rgb(var(--marron)/0.45)]"
      }`}
    >
      <span className="absolute inset-0 overflow-hidden">
        <span
          className={`absolute inset-y-0 left-0 w-1/4 animate-brillo bg-gradient-to-r from-transparent to-transparent motion-reduce:hidden ${
            discreta ? "via-crema/50" : "via-crema/80"
          }`}
        />
      </span>
    </div>
  );
}
