// Deletes the SQLite file and recreates it with demo data: `npm run db:reset`
import fs from 'node:fs'
import { config } from '../config.js'

if (config.dbFile !== ':memory:') {
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(config.dbFile + suffix, { force: true })
}

const { migrate } = await import('./index.js')
const { seed } = await import('./seed.js')
migrate()
seed()
console.log(`Database reset: ${config.dbFile}`)
