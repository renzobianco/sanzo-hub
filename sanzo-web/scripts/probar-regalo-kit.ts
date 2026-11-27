// Prueba del regalo de Black Friday (chapita gratis con el kit): npx tsx scripts/probar-regalo-kit.ts
import assert from "node:assert/strict";

const RealDate = Date;
function fijarFecha(iso: string) {
  const t = new RealDate(iso).getTime();
  // @ts-expect-error reemplazo simple para la prueba
  globalThis.Date = class extends RealDate {
    constructor(...a: unknown[]) {
      // @ts-expect-error idem
      super(...(a.length ? a : [t]));
    }
    static now() { return t; }
  };
}

async function main() {
  const { calcularTotales } = await import("../lib/carrito");
  const u = { provincia: "Córdoba", cp: "5000", entrega: "domicilio" as const };
  const kit = { key: "k", productoId: "kit-completo", opcion: "M", cantidad: 1 };
  const ch = (k: string, n = 1) => ({ key: k, productoId: "chapita", opcion: "Huesito · Coco", cantidad: n });

  const casos: [string, string, unknown[], number][] = [
    // fecha, descripción, líneas, total de productos esperado
    ["2026-11-26T12:00:00-03:00", "antes de BF: kit + chapita = 67.999", [kit, ch("a")], 67999],
    ["2026-11-27T10:00:00-03:00", "BF: kit + chapita = 59.999", [kit, ch("a")], 59999],
    ["2026-11-27T10:00:00-03:00", "BF: kit solo = 59.999", [kit], 59999],
    ["2026-11-27T10:00:00-03:00", "BF: kit + 2 chapitas = 67.999", [kit, ch("a"), ch("b")], 67999],
    ["2026-11-27T10:00:00-03:00", "BF: kit + 4 chapitas (1 regalo + 3x2) = 75.999", [kit, ch("a", 4)], 75999],
    ["2026-11-30T23:59:00-03:00", "último minuto BF = 59.999", [kit, ch("a")], 59999],
    ["2026-12-01T00:00:00-03:00", "después de BF = 67.999", [kit, ch("a")], 67999],
    ["2026-11-28T10:00:00-03:00", "BF sin kit: 1 chapita sola = 8.000", [ch("a")], 8000],
  ];
  for (const [fecha, desc, lineas, esperado] of casos) {
    fijarFecha(fecha);
    const t = calcularTotales(lineas as never, u);
    const productos = t.subtotal - t.ahorro;
    console.log(`${productos === esperado ? "OK " : "MAL"} ${desc} → ${productos} | ${t.descuentos.map((d) => `${d.texto}: -${d.monto}`).join(", ")}`);
    assert.equal(productos, esperado, desc);
  }
  globalThis.Date = RealDate;
  console.log("Todo bien.");
}
main();
