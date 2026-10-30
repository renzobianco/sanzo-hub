import { chapita, getProducto, ofertaChapita, type Producto } from "@/data/products";
import { esChapita, llevaChapita, normalizarOpcionChapita, normalizarOpcionComboChapita } from "./chapita";
import { envioInfo, zonaPorCP, zonaPorProvincia, type TipoEntrega, type ZonaEnvio } from "@/data/envios";
import { clavePersonalizacion, normalizarPersonalizacion, precioPersonalizacion, type Personalizacion } from "./personalizacion";
import { armables, calcularPromos, type DescuentoAplicado, type Sugerencia } from "./promos";
import { armarOpcion, opcionesValidas, piezasConColor, porSeparadoDe } from "./combos";

export interface LineaCarrito {
  key: string;
  productoId: string;
  /** Valor de la opción elegida (talle o color), si aplica. */
  opcion?: string;
  /** Pieza con el nombre del perro, si la personalizó. */
  personalizacion?: Personalizacion;
  /** Chapita: la imagen que subió para grabar (link público de Supabase Storage). Va con el pedido y se ve en el Hub. */
  imagen?: string;
  cantidad: number;
}

/** Para calcular el envío: la provincia manda; si no hay, el código postal. */
export interface Ubicacion {
  provincia: string;
  cp: string;
  entrega: TipoEntrega;
}

export function zonaDeUbicacion(u: Ubicacion) {
  return u.provincia ? zonaPorProvincia(u.provincia) : zonaPorCP(u.cp);
}

export type EstadoEnvio =
  | { tipo: "gratis" }
  | { tipo: "sin-zona" }
  | { tipo: "cotizar"; zona: ZonaEnvio; entrega: TipoEntrega }
  | { tipo: "precio"; zona: ZonaEnvio; entrega: TipoEntrega; monto: number };

export interface LineaResuelta extends LineaCarrito {
  producto: Producto;
  /** Precio por unidad, con la personalización incluida. */
  unitario: number;
  subtotal: number;
}

export interface Totales {
  lineas: LineaResuelta[];
  unidades: number;
  subtotal: number;
  /** Combos armados con piezas sueltas (se restan del subtotal). */
  descuentos: DescuentoAplicado[];
  ahorro: number;
  /** Combos a medio armar: qué piezas faltan. */
  sugerencias: Sugerencia[];
  envio: EstadoEnvio;
  /** Total con promos y envío; si el envío no tiene precio, no lo suma. */
  total: number;
  contieneKit: boolean;
  /** Cuánto falta para el envío gratis por monto (null si no aplica). */
  faltaParaGratis: number | null;
}

export const MAX_CANTIDAD = 10;

export function claveLinea(productoId: string, opcion?: string, personalizacion?: Personalizacion, imagen?: string) {
  let base = opcion ? `${productoId}__${opcion}` : productoId;
  if (imagen) base += `__${imagen.slice(-24)}`;
  return personalizacion ? `${base}__${clavePersonalizacion(personalizacion)}` : base;
}

/** Descarta líneas de productos que ya no existen o no se pueden comprar. */
export function resolverLineas(lineas: LineaCarrito[]): LineaResuelta[] {
  const out: LineaResuelta[] = [];
  for (const l of lineas) {
    const producto = getProducto(l.productoId);
    if (!producto || producto.precio === null || !producto.disponible) continue;
    // La chapita lleva el grabado en la opción ("Huesito · KALA"): se revisa aparte.
    let opcion = l.opcion;
    if (esChapita(producto.id)) {
      const limpia = normalizarOpcionChapita(l.opcion);
      if (!limpia) continue;
      opcion = limpia;
    } else if (llevaChapita(producto)) {
      // Combo con chapita: talle + grabado ("M · Corazón · Coco").
      const limpia = normalizarOpcionComboChapita(producto, l.opcion);
      if (!limpia) continue;
      opcion = limpia;
    } else {
      const validas = opcionesValidas(producto);
      if (validas && (!l.opcion || !validas.includes(l.opcion))) continue;
    }
    // Personalización que ya no es válida (ej. se sacó un estilo): mejor no vender algo distinto a lo pedido.
    const personalizacion = l.personalizacion ? normalizarPersonalizacion(producto, l.personalizacion) : undefined;
    if (personalizacion === null) continue;
    const cantidad = Math.min(MAX_CANTIDAD, Math.max(1, Math.floor(l.cantidad) || 1));
    const unitario = producto.precio + (personalizacion ? precioPersonalizacion(producto, personalizacion) : 0);
    out.push({ ...l, opcion, personalizacion, cantidad, producto, unitario, subtotal: unitario * cantidad });
  }
  return out;
}

/**
 * Reglas:
 * - Combos armados (lib/promos.ts): si el carrito tiene todas las piezas de un combo o del kit,
 *   se descuenta lo que se ahorra frente a comprarlas sueltas.
 * - Envío: si el carrito tiene un producto con envío gratis (el kit), o lo que se paga por los
 *   productos llega a `envioInfo.gratisDesde`, el envío es $0 para todo el pedido.
 */
export function calcularTotales(lineas: LineaCarrito[], ubicacion: Ubicacion): Totales {
  const resueltas = resolverLineas(lineas);
  const subtotal = resueltas.reduce((s, l) => s + l.subtotal, 0);
  const unidades = resueltas.reduce((s, l) => s + l.cantidad, 0);
  let contieneKit = resueltas.some((l) => l.producto.envioGratis);

  const porProducto: Record<string, number> = {};
  for (const l of resueltas) porProducto[l.productoId] = (porProducto[l.productoId] ?? 0) + l.cantidad;
  const combosEnCarrito = resueltas.filter((l) => l.producto.tipo === "combo" || l.producto.tipo === "kit").map((l) => l.productoId);
  const { descuentos, sugerencias } = calcularPromos(porProducto, combosEnCarrito);
  descuentos.push(...descuentosChapitas(resueltas));
  const ahorro = descuentos.reduce((s, d) => s + d.monto, 0);
  // Kit armado con piezas sueltas: viaja gratis igual que el kit.
  if (descuentos.some((d) => d.envioGratis)) contieneKit = true;
  const productos = subtotal - ahorro;

  let envio: EstadoEnvio;
  const umbral = envioInfo.gratisDesde;
  const llegaAlMonto = umbral !== null && productos >= umbral;
  const faltaParaGratis = umbral !== null && !contieneKit && !llegaAlMonto && productos > 0 ? umbral - productos : null;

  if (contieneKit || llegaAlMonto) {
    envio = { tipo: "gratis" };
  } else {
    const zona = zonaDeUbicacion(ubicacion);
    const { entrega } = ubicacion;
    const monto = zona?.precio[entrega];
    if (!zona) envio = { tipo: "sin-zona" };
    else if (monto == null) envio = { tipo: "cotizar", zona, entrega };
    else envio = { tipo: "precio", zona, entrega, monto };
  }

  const total = productos + (envio.tipo === "precio" ? envio.monto : 0);
  return { lineas: resueltas, unidades, subtotal, descuentos, ahorro, sugerencias, envio, total, contieneKit, faltaParaGratis };
}

/**
 * Ahorro en chapitas, por línea (key → monto) y en total:
 * - 3x2 (Combo Manada): cada 3 chapitas del carrito (cualquier forma y grabado), una va de regalo → 3 chapitas = $16.000.
 * - Las que no completan un trío, sumadas a otra compra, salen `ofertaChapita.precio` ($6.000).
 * No se pisan: una chapita del trío no baja además a $6.000 (Santino, 2026-10-30: "tendría que aparecer 16").
 * Las chapitas van a precio de lista en la línea; el ahorro se resta aparte (y la línea lo muestra tachado).
 */
export function ahorroChapitas(lineas: LineaResuelta[]) {
  const porLinea: Record<string, number> = {};
  /** Por línea: cuántas entran en el Combo Manada y cuántas quedan sueltas (con su ahorro). */
  const reparto: Record<string, { enManada: number; sueltas: number; ahorroSueltas: number }> = {};
  // Orden estable: con el mismo precio, las primeras del carrito arman el combo.
  const unidades = lineas
    .filter((l) => esChapita(l.productoId))
    .flatMap((l) => Array.from({ length: l.cantidad }, () => ({ key: l.key, precio: l.unitario })))
    .sort((a, b) => b.precio - a.precio);
  const enTrios = ofertaChapita.tresPorDos.activa ? Math.floor(unidades.length / 3) * 3 : 0;
  const conOtraCompra = lineas.some((l) => !esChapita(l.productoId));
  let tresPorDos = 0;
  let conCompra = 0;
  let listaManada = 0;
  unidades.forEach((u, i) => {
    const r = (reparto[u.key] ??= { enManada: 0, sueltas: 0, ahorroSueltas: 0 });
    let monto = 0;
    if (i < enTrios) {
      r.enManada++;
      listaManada += u.precio;
      if (i % 3 === 2) tresPorDos += monto = u.precio;
    } else {
      r.sueltas++;
      if (conOtraCompra) {
        conCompra += monto = Math.max(0, u.precio - ofertaChapita.precio);
        r.ahorroSueltas += monto;
      }
    }
    if (monto) porLinea[u.key] = (porLinea[u.key] ?? 0) + monto;
  });
  // Con al menos un trío, el carrito las junta en una línea "Combo Manada" (como los otros combos) y las sueltas siguen aparte.
  return { porLinea, reparto, tresPorDos, conCompra, unidades: unidades.length, enManada: enTrios, listaManada, agrupadas: enTrios > 0 };
}

function descuentosChapitas(lineas: LineaResuelta[]): DescuentoAplicado[] {
  const { tresPorDos, conCompra } = ahorroChapitas(lineas);
  const out: DescuentoAplicado[] = [];
  if (tresPorDos) out.push({ promoId: "chapitas-3x2", texto: ofertaChapita.tresPorDos.texto, monto: tresPorDos, piezas: [chapita.id], envioGratis: false });
  if (conCompra) out.push({ promoId: "chapita-con-compra", texto: ofertaChapita.textoConCompra, monto: conCompra, piezas: [chapita.id], envioGratis: false });
  return out;
}

export type AhorroChapitas = ReturnType<typeof ahorroChapitas>;

/**
 * Lo que muestra cada línea del carrito: cuántas unidades, el precio de lista (tachado si es mayor) y lo que se paga.
 * Combos y kit: lista = las piezas por separado. Chapitas que entran en el Combo Manada no van acá (cantidad 0):
 * se muestran juntas en la línea del combo.
 */
export function precioDeLinea(l: LineaResuelta, ch: AhorroChapitas) {
  if (esChapita(l.productoId)) {
    const r = ch.reparto[l.key];
    if (!ch.agrupadas || !r) return { cantidad: l.cantidad, lista: l.subtotal, paga: l.subtotal - (ch.porLinea[l.key] ?? 0) };
    const lista = l.unitario * r.sueltas;
    return { cantidad: r.sueltas, lista, paga: lista - r.ahorroSueltas };
  }
  const separado = porSeparadoDe(l.producto);
  const extra = l.unitario - (l.producto.precio ?? 0);
  const lista = separado !== null ? (separado + extra) * l.cantidad : l.subtotal;
  return { cantidad: l.cantidad, lista, paga: l.subtotal };
}

/** Todo lo que ahorra en el pedido: combos frente a las piezas sueltas, 3x2 y demás descuentos. */
export function ahorroTotal(t: Totales) {
  const ch = ahorroChapitas(t.lineas);
  const enCombos = t.lineas
    .filter((l) => !esChapita(l.productoId))
    .reduce((s, l) => {
      const p = precioDeLinea(l, ch);
      return s + (p.lista - p.paga);
    }, 0);
  return enCombos + t.ahorro;
}

/** Cuántas chapitas sueltas hay en el carrito (para avisar cuando falta una para el 3x2). */
export function chapitasEnCarrito(lineas: LineaResuelta[]) {
  return lineas.filter((l) => esChapita(l.productoId)).reduce((s, l) => s + l.cantidad, 0);
}

/** Combos del carrito que entran enteros en `destino` (más chicos que él), sin pisarse entre sí. */
function combosQueEntran(lineas: LineaCarrito[], destino: Producto) {
  const usadas: { linea: LineaCarrito; combo: Producto }[] = [];
  const cubiertas = new Set<string>();
  const candidatos = lineas
    .filter((l) => l.cantidad > 0 && l.productoId !== destino.id)
    .map((linea) => ({ linea, combo: getProducto(linea.productoId) }))
    .filter(
      (c): c is { linea: LineaCarrito; combo: Producto } =>
        !!c.combo &&
        (c.combo.tipo === "combo" || c.combo.tipo === "kit") &&
        c.combo.incluye.length < destino.incluye.length &&
        c.combo.incluye.every((id) => destino.incluye.includes(id)) &&
        // Los de colores (gorra/piluso) no se desarman: no entran en otro.
        piezasConColor(c.combo).length === 0,
    )
    .sort((a, b) => b.combo.incluye.length - a.combo.incluye.length);
  for (const c of candidatos) {
    if (c.combo.incluye.some((id) => cubiertas.has(id))) continue;
    c.combo.incluye.forEach((id) => cubiertas.add(id));
    usadas.push(c);
  }
  return { usadas, cubiertas };
}

/**
 * Junta lo del carrito en combos:
 * - piezas sueltas que completan un combo (o el kit) → una sola línea del combo
 *   ("Combo Aventura", no "Arnés + Correa + Poo bag");
 * - un combo + las piezas que le faltan para uno más grande → el más grande
 *   (Combo Aventura + collar, moño y bandana → Kit completo).
 * Talle y colores salen de lo que se junta. No lo arma si no se puede juntar en uno
 * (talles o personalizaciones distintas): ahí quedan sueltas con el descuento igual.
 * Devuelve las líneas nuevas y los ids de los combos que armó.
 */
export function armarCombos(lineas: LineaCarrito[]): { lineas: LineaCarrito[]; armados: string[] } {
  let out = lineas.map((l) => ({ ...l }));
  const armados: string[] = [];
  const lista = armables();

  for (let vuelta = 0; vuelta < 20; vuelta++) {
    let armo = false;
    for (const { combo, piezas } of lista) {
      const { usadas: deCombos, cubiertas } = combosQueEntran(out, combo);
      // Lo que no cubre un combo del carrito sale de piezas sueltas (la primera línea de cada una).
      const faltan = piezas.filter((p) => !cubiertas.has(p.id));
      const sueltas = faltan.map((p) => ({ p, l: out.find((l) => l.productoId === p.id && l.cantidad > 0) }));
      if (sueltas.some((s) => !s.l)) continue;
      const deSueltas = sueltas as { p: Producto; l: LineaCarrito }[];

      const talles = new Set([
        ...deSueltas.filter(({ p, l }) => p.opcion?.nombre === "Talle" && l.opcion).map(({ l }) => l.opcion!),
        // Color + talle ("Beige · M"): el talle es la segunda parte.
        ...deSueltas.filter(({ p, l }) => p.opcionTalle && l.opcion?.includes(" · ")).map(({ l }) => l.opcion!.split(" · ")[1]),
        ...deCombos.filter(({ combo: c, linea }) => c.opcion?.nombre === "Talle" && linea.opcion).map(({ linea }) => linea.opcion!.split(" · ")[0]),
      ]);
      if (talles.size > 1) continue;
      const colores: Record<string, string> = {};
      for (const { p, l } of deSueltas) if (p.opcion?.colores && l.opcion) colores[p.id] = l.opcion.split(" · ")[0];
      const talle = [...talles][0] ?? "";
      const opcion = (piezasConColor(combo).length ? armarOpcion(combo, talle, colores) : talle) || undefined;
      const validas = opcionesValidas(combo);
      if (validas && (!opcion || !validas.includes(opcion))) continue;

      const ls = [...deSueltas.map((s) => s.l), ...deCombos.map((c) => c.linea)];
      const claves = new Set(ls.map((l) => clavePersonalizacion(l.personalizacion)));
      if (claves.size > 1) continue;
      const pers = ls[0].personalizacion ? normalizarPersonalizacion(combo, ls[0].personalizacion) : undefined;
      if (pers === null) continue;

      for (const l of ls) l.cantidad -= 1;
      out = out.filter((l) => l.cantidad > 0);
      const key = claveLinea(combo.id, opcion, pers);
      const existe = out.find((l) => l.key === key);
      if (existe) existe.cantidad = Math.min(MAX_CANTIDAD, existe.cantidad + 1);
      else out.push({ key, productoId: combo.id, opcion, personalizacion: pers, cantidad: 1 });
      armados.push(combo.id);
      armo = true;
      break; // vuelve a empezar: el kit tiene prioridad sobre los combos
    }
    if (!armo) break;
  }
  return { lineas: armados.length ? out : lineas, armados };
}
