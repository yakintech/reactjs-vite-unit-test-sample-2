import { db, transaction } from '../db/index.js'
import { badRequest } from '../lib/http.js'
import { moq, roundMoney, tierFor, tiersByProduct } from './catalog.js'

export const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP']
export const ORDER_TYPES = ['rfq', 'order']
export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

// Validates the payload, re-prices every line on the server and stores the order.
// Client-side prices are never trusted.
export function createOrder(user, payload) {
  const type = payload.type ?? 'rfq'
  if (!ORDER_TYPES.includes(type)) throw badRequest(`type must be one of: ${ORDER_TYPES.join(', ')}`)

  const incoterm = String(payload.incoterm ?? '').toUpperCase()
  if (!INCOTERMS.includes(incoterm)) throw badRequest(`incoterm must be one of: ${INCOTERMS.join(', ')}`)

  const destination = String(payload.destination ?? '').trim()
  if (!destination) throw badRequest('destination is required')

  if (!Array.isArray(payload.items) || payload.items.length === 0) throw badRequest('items must be a non-empty array')

  // Merge duplicate product lines.
  const quantities = new Map()
  for (const item of payload.items) {
    const qty = Number(item?.quantity)
    if (typeof item?.productId !== 'string' || !Number.isInteger(qty) || qty <= 0) {
      throw badRequest('Each item needs a productId and a positive integer quantity')
    }
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + qty)
  }

  const ids = [...quantities.keys()]
  const products = db
    .prepare(`SELECT * FROM products WHERE active = 1 AND id IN (${ids.map(() => '?').join(',')})`)
    .all(...ids)
  const byId = new Map(products.map((p) => [p.id, p]))
  const tiers = tiersByProduct(ids)

  const lines = ids.map((id) => {
    const product = byId.get(id)
    if (!product) throw badRequest(`Unknown product: ${id}`)
    const productTiers = tiers.get(id)
    if (!productTiers.length) throw badRequest(`Product ${product.sku} has no price list`)
    const quantity = quantities.get(id)
    const min = moq(productTiers)
    if (quantity < min) throw badRequest(`Minimum order quantity for ${product.sku} is ${min} ${product.unit}s`)
    const unitPrice = tierFor(productTiers, quantity).price
    return { product, quantity, unitPrice, lineTotal: roundMoney(unitPrice * quantity) }
  })

  const total = roundMoney(lines.reduce((s, l) => s + l.lineTotal, 0))

  return transaction(() => {
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO orders (user_id, type, incoterm, destination, notes, currency, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(user.id, type, incoterm, destination, payload.notes ? String(payload.notes) : null, user.currency, total)

    const orderId = Number(lastInsertRowid)
    const prefix = type === 'rfq' ? 'RFQ' : 'SO'
    const ref = `${prefix}-${String(new Date().getFullYear()).slice(2)}-${String(orderId).padStart(4, '0')}`
    db.prepare('UPDATE orders SET ref = ? WHERE id = ?').run(ref, orderId)

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, sku, unit, quantity, unit_price, line_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    for (const l of lines) {
      insertItem.run(orderId, l.product.id, l.product.name, l.product.sku, l.product.unit, l.quantity, l.unitPrice, l.lineTotal)
    }

    return { id: ref, orderId, status: 'pending', total, currency: user.currency }
  })
}
