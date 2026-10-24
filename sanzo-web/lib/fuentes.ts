import { Bebas_Neue, Caveat, Cinzel, Courier_Prime, Fredoka, Great_Vibes, Pacifico, Playfair_Display } from "next/font/google";

// Letras del grabado (`personalizacion.fuentes` en data/products.ts, mismo id).
// preload: false → el archivo de cada letra se baja recién cuando se usa (al abrir el personalizador).
const playfair = Playfair_Display({ subsets: ["latin"], weight: "500", preload: false, display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], weight: "500", preload: false, display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", preload: false, display: "swap" });
const fredoka = Fredoka({ subsets: ["latin"], weight: "500", preload: false, display: "swap" });
const courier = Courier_Prime({ subsets: ["latin"], weight: "700", preload: false, display: "swap" });
const greatvibes = Great_Vibes({ subsets: ["latin"], weight: "400", preload: false, display: "swap" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", preload: false, display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: "600", preload: false, display: "swap" });

/** font-family de cada letra. "jost" es la de la marca (ya cargada en el layout). */
export const FAMILIAS: Record<string, { familia: string; peso: number }> = {
  jost: { familia: "var(--font-jost), sans-serif", peso: 450 },
  playfair: { familia: playfair.style.fontFamily, peso: 500 },
  cinzel: { familia: cinzel.style.fontFamily, peso: 500 },
  bebas: { familia: bebas.style.fontFamily, peso: 400 },
  fredoka: { familia: fredoka.style.fontFamily, peso: 500 },
  courier: { familia: courier.style.fontFamily, peso: 700 },
  greatvibes: { familia: greatvibes.style.fontFamily, peso: 400 },
  pacifico: { familia: pacifico.style.fontFamily, peso: 400 },
  caveat: { familia: caveat.style.fontFamily, peso: 600 },
};

export function familia(id: string) {
  return FAMILIAS[id] ?? FAMILIAS.jost;
}
