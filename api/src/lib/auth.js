import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { db } from '../db/index.js'
import { forbidden, unauthorized } from './http.js'

const KEY_LEN = 64

export function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, KEY_LEN)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return crypto.timingSafeEqual(expected, actual)
}

export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

// Returns the active user for the request's Bearer token, null when there is no token,
// and throws 401 when the token is invalid or the account is not active.
function userFromRequest(req) {
  const header = req.get('authorization') || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null

  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret)
  } catch {
    throw unauthorized('Invalid or expired token')
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(payload.sub))
  if (!user || user.status !== 'active') throw unauthorized('Account is not active')
  return user
}

export function optionalAuth(req, _res, next) {
  try {
    req.user = userFromRequest(req)
  } catch {
    req.user = null
  }
  next()
}

export function requireAuth(req, _res, next) {
  req.user = userFromRequest(req)
  if (!req.user) throw unauthorized()
  next()
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') throw forbidden('Admin access required')
  next()
}
