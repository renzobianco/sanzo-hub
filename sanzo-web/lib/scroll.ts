/**
 * Traba el scroll de la página mientras hay algo abierto (ficha, zoom, cartel de la chapita, carrito).
 * Lleva la cuenta de cuántos lo pidieron: la página vuelve a deslizarse recién cuando se cierra el último.
 * Antes cada uno guardaba y restauraba `overflow` por su cuenta y, si se cruzaban (ficha → carrito), la página
 * quedaba trabada hasta refrescar.
 */
let abiertos = 0;

/** Traba el scroll y devuelve la función que lo libera (llamarla más de una vez no hace nada). */
export function trabarScroll() {
  abiertos++;
  document.body.style.overflow = "hidden";
  let liberado = false;
  return () => {
    if (liberado) return;
    liberado = true;
    abiertos = Math.max(0, abiertos - 1);
    if (abiertos === 0) document.body.style.overflow = "";
  };
}
