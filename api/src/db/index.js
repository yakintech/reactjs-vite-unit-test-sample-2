import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { config } from '../config.js'

if (config.dbFile !== ':memory:') fs.mkdirSync(path.dirname(config.dbFile), { recursive: true })

export const db = new DatabaseSync(config.dbFile)
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id                TEXT PRIMARY KEY,
  sku               TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  category_id       TEXT NOT NULL REFERENCES categories(id),
  description       TEXT,
  icon              TEXT,
  image             TEXT,
  origin            TEXT,
  origin_flag       TEXT,
  brand             TEXT,
  unit              TEXT NOT NULL,
  pack_size         TEXT,
  units_per_pallet  INTEGER,
  hs_code           TEXT,
  shelf_life        TEXT,
  storage           TEXT,
  certifications    TEXT NOT NULL DEFAULT '[]',  -- JSON array
  incoterms         TEXT NOT NULL DEFAULT '[]',  -- JSON array
  lead_time_days    INTEGER,
  stock             INTEGER NOT NULL DEFAULT 0,
  active            INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE TABLE IF NOT EXISTS price_tiers (
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  min_qty     INTEGER NOT NULL CHECK (min_qty > 0),
  price       REAL NOT NULL CHECK (price >= 0),
  PRIMARY KEY (product_id, min_qty)
);

CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,
  company        TEXT NOT NULL,
  business_type  TEXT,
  phone          TEXT,
  country        TEXT,
  vat_number     TEXT,
  currency       TEXT NOT NULL DEFAULT 'USD',
  role           TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'admin')),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ref          TEXT UNIQUE,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  type         TEXT NOT NULL CHECK (type IN ('rfq', 'order')),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  incoterm     TEXT NOT NULL,
  destination  TEXT NOT NULL,
  notes        TEXT,
  currency     TEXT NOT NULL DEFAULT 'USD',
  total        REAL NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

CREATE TABLE IF NOT EXISTS order_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    TEXT NOT NULL REFERENCES products(id),
  product_name  TEXT NOT NULL,
  sku           TEXT NOT NULL,
  unit          TEXT NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    REAL NOT NULL,
  line_total    REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`

export function migrate() {
  db.exec(SCHEMA)
}

export function transaction(fn) {
  db.exec('BEGIN')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}
