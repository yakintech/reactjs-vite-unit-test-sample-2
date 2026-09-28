import { Router } from 'express'
import { config } from '../config.js'
import { db } from '../db/index.js'
import { hashPassword, requireAuth, signToken, verifyPassword } from '../lib/auth.js'
import { HttpError, badRequest, forbidden, requireFields, str, unauthorized } from '../lib/http.js'
import { toUser } from '../lib/mappers.js'

const router = Router()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post('/register', (req, res) => {
  const body = req.body ?? {}
  requireFields(body, ['company', 'name', 'email', 'password', 'country'])

  const email = str(body.email).toLowerCase()
  if (!EMAIL_RE.test(email)) throw badRequest('Invalid email address')
  if (String(body.password).length < 8) throw badRequest('Password must be at least 8 characters')

  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw new HttpError(409, 'An account with this email already exists')
  }

  const status = config.autoApproveBuyers ? 'active' : 'pending'
  db.prepare(
    `INSERT INTO users (email, password_hash, name, company, business_type, phone, country, vat_number, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    email,
    hashPassword(String(body.password)),
    str(body.name),
    str(body.company),
    str(body.businessType),
    str(body.phone),
    str(body.country),
    str(body.vatNumber),
    status
  )

  res.status(201).json({
    status,
    message:
      status === 'active'
        ? 'Your trade account is active. You can sign in now.'
        : 'Application received. Your account will be reviewed within 1 business day.',
  })
})

router.post('/login', (req, res) => {
  requireFields(req.body, ['email', 'password'])
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(str(req.body.email))

  if (!user || !verifyPassword(String(req.body.password), user.password_hash)) {
    throw unauthorized('Invalid email or password')
  }
  if (user.status === 'pending') throw forbidden('Your account is awaiting approval')
  if (user.status !== 'active') throw forbidden('Your account has been suspended')

  res.json({ token: signToken(user), user: toUser(user) })
})

router.get('/me', requireAuth, (req, res) => {
  res.json(toUser(req.user))
})

export default router
