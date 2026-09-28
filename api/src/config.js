try {
  process.loadEnvFile()
} catch {
  /* no .env file — rely on the real environment */
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbFile: process.env.DB_FILE || 'data/b2b.sqlite',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  autoApproveBuyers: process.env.AUTO_APPROVE_BUYERS === 'true',
  isProd: process.env.NODE_ENV === 'production',
}

if (config.isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production')
}
