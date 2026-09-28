import { Router } from 'express'
import { db } from '../db/index.js'
import { requireAuth } from '../lib/auth.js'
import { notFound } from '../lib/http.js'
import { toOrderItem, toOrderSummary } from '../lib/mappers.js'
import { createOrder } from '../services/orders.js'

const router = Router()
router.use(requireAuth)

export const ORDER_SUMMARY_SQL = `
  SELECT o.*, COUNT(oi.id) AS item_count
  FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id`

router.get('/', (req, res) => {
  const rows = db
    .prepare(`${ORDER_SUMMARY_SQL} WHERE o.user_id = ? GROUP BY o.id ORDER BY o.id DESC`)
    .all(req.user.id)
  res.json(rows.map(toOrderSummary))
})

router.get('/:ref', (req, res) => {
  const row = db.prepare(`${ORDER_SUMMARY_SQL} WHERE o.ref = ? GROUP BY o.id`).get(req.params.ref)
  // Buyers only see their own orders; 404 rather than 403 so refs cannot be probed.
  if (!row || (row.user_id !== req.user.id && req.user.role !== 'admin')) throw notFound('Order not found')

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(row.id)
  res.json({ ...toOrderSummary(row), notes: row.notes, lines: items.map(toOrderItem) })
})

router.post('/', (req, res) => {
  const order = createOrder(req.user, req.body ?? {})
  res.status(201).json({ id: order.id, status: order.status, total: order.total, currency: order.currency })
})

export default router
