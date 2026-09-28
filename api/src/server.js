import { createApp } from './app.js'
import { config } from './config.js'
import { db, migrate } from './db/index.js'
import { seed } from './db/seed.js'

migrate()
if (db.prepare('SELECT COUNT(*) AS n FROM categories').get().n === 0) {
  seed()
  console.log('Database was empty — seeded demo data.')
}

createApp().listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}/api`)
})
