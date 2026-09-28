import { hashPassword } from '../lib/auth.js'
import { createOrder } from '../services/orders.js'
import { db, transaction } from './index.js'
import { categories, products } from './seedData.js'

export const DEMO_USERS = [
  {
    email: 'buyer@demo.com', password: 'demo', role: 'buyer', name: 'Demo Buyer',
    company: 'Nordic Food Import AB', businessType: 'Importer', country: 'Sweden', vatNumber: 'SE556677889901',
  },
  {
    email: 'admin@demo.com', password: 'admin', role: 'admin', name: 'Sales Admin',
    company: 'Global Foods Trading Ltd.', businessType: null, country: 'Türkiye', vatNumber: null,
  },
]

export function seed() {
  transaction(() => {
    const insertCategory = db.prepare('INSERT INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)')
    categories.forEach((c, i) => insertCategory.run(c.id, c.name, c.icon, i))

    const insertProduct = db.prepare(
      `INSERT INTO products (id, sku, name, category_id, description, icon, image, origin, origin_flag, brand, unit,
         pack_size, units_per_pallet, hs_code, shelf_life, storage, certifications, incoterms, lead_time_days, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    const insertTier = db.prepare('INSERT INTO price_tiers (product_id, min_qty, price) VALUES (?, ?, ?)')
    for (const p of products) {
      insertProduct.run(
        p.id, p.sku, p.name, p.category, p.description, p.icon, p.image ?? null, p.origin, p.originFlag, p.brand, p.unit,
        p.packSize, p.unitsPerPallet, p.hsCode, p.shelfLife, p.storage,
        JSON.stringify(p.certifications), JSON.stringify(p.incoterms), p.leadTimeDays, p.stock
      )
      for (const t of p.priceTiers) insertTier.run(p.id, t.minQty, t.price)
    }

    const insertUser = db.prepare(
      `INSERT INTO users (email, password_hash, name, company, business_type, country, vat_number, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`
    )
    for (const u of DEMO_USERS) {
      insertUser.run(u.email, hashPassword(u.password), u.name, u.company, u.businessType, u.country, u.vatNumber, u.role)
    }
  })

  // A few sample orders for the demo buyer (createOrder opens its own transaction).
  const buyer = db.prepare('SELECT * FROM users WHERE email = ?').get('buyer@demo.com')
  const samples = [
    { type: 'order', incoterm: 'FOB', destination: 'Gothenburg, SE', status: 'delivered', daysAgo: 31,
      items: [{ productId: 'p-1001', quantity: 40 }, { productId: 'p-5002', quantity: 120 }] },
    { type: 'order', incoterm: 'CIF', destination: 'Gothenburg, SE', status: 'shipped', daysAgo: 16,
      items: [{ productId: 'p-2001', quantity: 40 }, { productId: 'p-3001', quantity: 400 }, { productId: 'p-4001', quantity: 10 }] },
    { type: 'rfq', incoterm: 'CIF', destination: 'Stockholm, SE', status: 'pending', daysAgo: 3,
      items: [{ productId: 'p-1002', quantity: 72 }, { productId: 'p-6001', quantity: 100 }] },
  ]
  for (const s of samples) {
    const { orderId } = createOrder(buyer, s)
    db.prepare(`UPDATE orders SET status = ?, created_at = datetime('now', ?) WHERE id = ?`).run(s.status, `-${s.daysAgo} days`, orderId)
  }
}
