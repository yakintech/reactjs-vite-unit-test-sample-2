import { db } from '../db/index.js'

// Loads price tiers for the given product ids, grouped by product id and sorted by min_qty.
export function tiersByProduct(ids) {
  const map = new Map(ids.map((id) => [id, []]))
  if (!ids.length) return map
  const rows = db
    .prepare(`SELECT * FROM price_tiers WHERE product_id IN (${ids.map(() => '?').join(',')}) ORDER BY min_qty`)
    .all(...ids)
  for (const r of rows) map.get(r.product_id).push(r)
  return map
}

export const moq = (tiers) => (tiers.length ? tiers[0].min_qty : 1)

// Tier that applies to `qty`: the highest min_qty that is <= qty. Tiers must be sorted ascending.
export function tierFor(tiers, qty) {
  let match = tiers[0]
  for (const t of tiers) if (qty >= t.min_qty) match = t
  return match
}

export const roundMoney = (n) => Math.round(n * 100) / 100
