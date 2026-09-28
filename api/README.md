# Global Foods B2B — API

Node.js + Express 5 + SQLite (Node's built-in `node:sqlite`, no native build). Requires **Node ≥ 22.13**.

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:4000/api (auto-reload)
npm test           # integration tests on an in-memory DB
npm run db:reset   # wipe and re-seed data/b2b.sqlite
```

On first start the database is created and seeded with the demo catalog, sample orders and two users:

| Email | Password | Role |
|---|---|---|
| `buyer@demo.com` | `demo` | buyer |
| `admin@demo.com` | `admin` | admin |

## Using it with the frontend

In `site/.env` set `VITE_USE_MOCK=false` and keep `VITE_API_URL=/api`. The Vite dev server proxies `/api` to `http://localhost:4000`.

## Endpoints

All routes are under `/api`. Errors return `{ message, details? }` with a matching HTTP status.
Authenticated routes need `Authorization: Bearer <token>`.

### Catalog (public)
| Method | Path | Notes |
|---|---|---|
| GET | `/categories` | `[{ id, name, icon, productCount }]` |
| GET | `/products` | Query: `q`, `category`, `origin`, `cert`, `sort` (`name` / `price-asc` / `price-desc` / `newest`), `page`, `pageSize` (≤100). Returns `{ items, total, page, pageSize }` |
| GET | `/products/facets` | `{ origins, certifications }` |
| GET | `/products/:id` | Product |

Anonymous visitors get `priceTiers` with `price: null`, so the MOQ stays visible but prices do not. Signed-in buyers get the full prices.

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `{ company, name, email, password (≥8), country, businessType?, phone?, vatNumber? }`. New accounts are `pending` unless `AUTO_APPROVE_BUYERS=true` |
| POST | `/auth/login` | `{ email, password }` → `{ token, user }`. `403` if pending/suspended |
| GET | `/auth/me` | Current user |

### Orders / RFQs (auth)
| Method | Path | Notes |
|---|---|---|
| GET | `/orders` | Current buyer's orders: `[{ id, type, date, status, incoterm, destination, currency, total, items }]` |
| GET | `/orders/:ref` | Order with `lines` (own orders only; admins see all) |
| POST | `/orders` | `{ type: 'rfq'\|'order', incoterm, destination, notes?, items: [{ productId, quantity }] }` → `{ id, status, total, currency }` |

Orders are **re-priced on the server** from the volume tiers (client prices are ignored). Duplicate lines are merged and MOQ is enforced. References look like `SO-26-0001` / `RFQ-26-0003`.

### Admin (role `admin`)
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/users?status=pending` | List buyers |
| PATCH | `/admin/users/:id` | `{ status: 'pending'\|'active'\|'suspended' }` — approve/suspend accounts |
| GET | `/admin/orders?status=` | All orders with company/email |
| PATCH | `/admin/orders/:ref` | `{ status: 'pending'\|'confirmed'\|'shipped'\|'delivered'\|'cancelled' }` |

## Structure

```
src/
  server.js          start + migrate + seed on empty DB
  app.js             express app, CORS, error handling
  config.js          env config (.env loaded automatically)
  db/                schema (index.js), seed data, reset script
  lib/               auth (scrypt + JWT), HTTP errors, row → JSON mappers
  services/          pricing tiers, order creation
  routes/            catalog, auth, orders, admin
test/api.test.js     node:test integration tests
```

## Not included yet

Product/category management endpoints, stock reservation, email notifications, multi-currency pricing, rate limiting and file uploads (product images: set `image` to a URL).
