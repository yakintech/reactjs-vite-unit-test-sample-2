import { Router } from 'express'
import { db } from '../db/index.js'
import { requireAdmin, requireAuth } from '../lib/auth.js'
import { badRequest, notFound } from '../lib/http.js'
import { toOrderSummary, toUser } from '../lib/mappers.js'
import { ORDER_STATUSES } from '../services/orders.js'
import { ORDER_SUMMARY_SQL } from './orders.js'

const router = Router()
router.use(requireAuth, requireAdmin)

const USER_STATUSES = ['pending', 'active', 'suspended']

// GET /admin/users?status=pending
router.get('/users', (req, res) => {
  const { status } = req.query
  const rows = status
    ? db.prepare('SELECT * FROM users WHERE status = ? ORDER BY id DESC').all(String(status))
    : db.prepare('SELECT * FROM users ORDER BY id DESC').all()
  res.json(rows.map(toUser))
})

// PATCH /admin/users/:id { status }
router.patch('/users/:id', (req, res) => {
  const status = req.body?.status
  if (!USER_STATUSES.includes(status)) throw badRequest(`status must be one of: ${USER_STATUSES.join(', ')}`)
  const { changes } = db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, Number(req.params.id))
  if (!changes) throw notFound('User not found')
  res.json(toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id))))
})

// GET /admin/orders?status=pending
router.get('/orders', (req, res) => {
  const { status } = req.query
  const rows = db
    .prepare(
      `SELECT s.*, u.company, u.email FROM (${ORDER_SUMMARY_SQL} ${status ? 'WHERE o.status = ?' : ''} GROUP BY o.id) s
       JOIN users u ON u.id = s.user_id ORDER BY s.id DESC`
    )
    .all(...(status ? [String(status)] : []))
  res.json(rows.map((r) => ({ ...toOrderSummary(r), company: r.company, email: r.email })))
})

// PATCH /admin/orders/:ref { status }
router.patch('/orders/:ref', (req, res) => {
  const status = req.body?.status
  if (!ORDER_STATUSES.includes(status)) throw badRequest(`status must be one of: ${ORDER_STATUSES.join(', ')}`)
  const { changes } = db.prepare('UPDATE orders SET status = ? WHERE ref = ?').run(status, req.params.ref)
  if (!changes) throw notFound('Order not found')
  res.json({ id: req.params.ref, status })
})

export default router
