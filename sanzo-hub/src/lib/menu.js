// Orden y colores del menú, a gusto de cada socio.
// Se guarda en settings.navLayout[socio] = { order: [keys], colors: { key: '#hex' } }
// para que siga igual en la compu y en el celu.

export const MENU_COLORS = [
  { value: '#956037', name: 'Caramelo' },
  { value: '#b5533c', name: 'Terracota' },
  { value: '#d9822b', name: 'Naranja' },
  { value: '#c9a227', name: 'Mostaza' },
  { value: '#6b8f5e', name: 'Verde' },
  { value: '#2f8f83', name: 'Jade' },
  { value: '#3b6ea5', name: 'Océano' },
  { value: '#7a5ba6', name: 'Violeta' },
  { value: '#c2577f', name: 'Rosa' },
  { value: '#4a4039', name: 'Gris oscuro' },
]

// Devuelve los ítems en el orden guardado; los que no estén (secciones nuevas) van al final
// en su orden original. Le suma a cada uno su color, si tiene.
export function applyMenuLayout(items, layout) {
  const order = Array.isArray(layout?.order) ? layout.order : []
  const colors = layout?.colors || {}
  const byKey = new Map(items.map((it) => [it.key, it]))
  const sorted = []
  for (const k of order) {
    if (byKey.has(k)) {
      sorted.push(byKey.get(k))
      byKey.delete(k)
    }
  }
  for (const it of items) if (byKey.has(it.key)) sorted.push(it)
  return sorted.map((it) => (colors[it.key] ? { ...it, color: colors[it.key] } : it))
}
