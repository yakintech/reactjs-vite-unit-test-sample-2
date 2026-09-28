import { Router } from 'express'
import { db } from '../db/index.js'
import { optionalAuth } from '../lib/auth.js'
import { notFound } from '../lib/http.js'
import { toProduct } from '../lib/mappers.js'
import { tiersByProduct } from '../services/catalog.js'

const router = Router()
router.use(optionalAuth)

const MIN_PRICE = '(SELECT MIN(price) FROM price_tiers t WHERE t.product_id = p.id)'
const SORTS = {
  name: 'p.name COLLATE NOCASE ASC',
  'price-asc': `${MIN_PRICE} ASC`,
  'price-desc': `${MIN_PRICE} DESC`,
  newest: 'p.created_at DESC',
}

router.get('/categories', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.active = 1) AS product_count
       FROM categories c ORDER BY c.sort_order, c.name`
    )
    .all()
  res.json(rows.map((c) => ({ id: c.id, name: c.name, icon: c.icon, productCount: c.product_count })))
})

router.get('/products/facets', (_req, res) => {
  const origins = db
    .prepare('SELECT DISTINCT origin FROM products WHERE active = 1 AND origin IS NOT NULL ORDER BY origin')
    .all()
    .map((r) => r.origin)
  const certifications = db
    .prepare(
      `SELECT DISTINCT j.value AS cert FROM products p, json_each(p.certifications) j
       WHERE p.active = 1 ORDER BY j.value`
    )
    .all()
    .map((r) => r.cert)
  res.json({ origins, certifications })
})

// GET /products?q=&category=&origin=&cert=&sort=&page=&pageSize=
router.get('/products', (req, res) => {
  const { q, category, origin, cert, sort } = req.query
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 48))

  const where = ['p.active = 1']
  const params = []
  if (category) {
    where.push('p.category_id = ?')
    params.push(String(category))
  }
  if (origin) {
    where.push('p.origin = ?')
    params.push(String(origin))
  }
  if (cert) {
    where.push('EXISTS (SELECT 1 FROM json_each(p.certifications) j WHERE j.value = ?)')
    params.push(String(cert))
  }
  if (q) {
    where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ? OR p.origin LIKE ?)')
    const like = `%${String(q)}%`
    params.push(like, like, like, like)
  }

  const whereSql = where.join(' AND ')
  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM products p WHERE ${whereSql}`).get(...params)
  const rows = db
    .prepare(`SELECT p.* FROM products p WHERE ${whereSql} ORDER BY ${SORTS[sort] || 'p.id'} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize)

  const tiers = tiersByProduct(rows.map((r) => r.id))
  const showPrices = Boolean(req.user)
  res.json({
    items: rows.map((r) => toProduct(r, tiers.get(r.id), { showPrices })),
    total,
    page,
    pageSize,
  })
})

router.get('/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(req.params.id)
  if (!row) throw notFound('Product not found')
  const tiers = tiersByProduct([row.id]).get(row.id)
  res.json(toProduct(row, tiers, { showPrices: Boolean(req.user) }))
})

export default router
