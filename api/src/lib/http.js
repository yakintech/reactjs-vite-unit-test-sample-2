export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details)
export const unauthorized = (message = 'Authentication required') => new HttpError(401, message)
export const forbidden = (message = 'Forbidden') => new HttpError(403, message)
export const notFound = (message = 'Not found') => new HttpError(404, message)

// Throws 400 listing any required fields that are missing or blank.
export function requireFields(body, fields) {
  const missing = fields.filter((f) => body?.[f] === undefined || body[f] === null || String(body[f]).trim() === '')
  if (missing.length) throw badRequest(`Missing required fields: ${missing.join(', ')}`, { missing })
}

export const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? null : String(v).trim())
