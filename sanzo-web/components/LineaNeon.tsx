/** Línea marrón con brillo tipo neón y una luz que la recorre. Separa partes de la página. */
export function LineaNeon() {
  return (
    <div aria-hidden="true" className="relative z-10 h-[3px] bg-marron shadow-[0_0_8px_1px_rgb(var(--marron)/0.9),0_0_22px_4px_rgb(var(--marron)/0.45)]">
      <span className="absolute inset-0 overflow-hidden">
        <span className="absolute inset-y-0 left-0 w-1/4 animate-brillo bg-gradient-to-r from-transparent via-crema/80 to-transparent motion-reduce:hidden" />
      </span>
    </div>
  );
}
