import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { HttpError } from './lib/http.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import catalogRoutes from './routes/catalog.js'
import orderRoutes from './routes/orders.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: config.corsOrigins }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (_req, res) => res.json({ ok: true }))

  const api = express.Router()
  api.use('/auth', authRoutes)
  api.use('/orders', orderRoutes)
  api.use('/admin', adminRoutes)
  api.use(catalogRoutes)
  app.use('/api', api)

  app.use((_req, res) => res.status(404).json({ message: 'Not found' }))

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message, ...(err.details && { details: err.details }) })
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Invalid JSON body' })
    }
    console.error(err)
    res.status(500).json({ message: 'Internal server error' })
  })

  return app
}
